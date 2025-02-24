import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const TimelineContext = createContext(null);

export const useTimeline = () => {
    const context = useContext(TimelineContext);
    if (!context) {
        throw new Error('useTimeline must be used within a TimelineProvider');
    }
    return context;
};

export const TimelineProvider = ({ children }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [editedRows, setEditedRows] = useState({});
    const [pendingRows, setPendingRows] = useState([]);
    const [socket, setSocket] = useState(null);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [hasScrolledToCurrentWeek, setHasScrolledToCurrentWeek] = useState(false);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join', 'timelines');
        });

        newSocket.on('timeline-update', handleRemoteUpdate);
        newSocket.on('timeline-delete', handleRemoteDelete);
        newSocket.on('timeline-create', handleRemoteCreate);

        fetchData();

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/timelines');
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();
            setData(result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoteUpdate = useCallback((updatedRow) => {
        setData(prevData => {
            const newData = prevData.map(row => 
                row.id === updatedRow.id ? updatedRow : row
            );
            return newData.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        });
    }, []);

    const handleRemoteDelete = useCallback((id) => {
        setData(prevData => prevData.filter(row => row.id !== id));
    }, []);

    const handleRemoteCreate = useCallback((newRow) => {
        setData(prevData => {
            const newData = [...prevData, newRow];
            return newData.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        });
    }, []);

    const addRow = () => {
        const newRow = {
            id: `pending-${Date.now()}`,
            market: '',
            clientSponsor: '',
            project: '',
            dueDate: '',
            task: '',
            complete: false,
            team: '',
            me: '',
            deployment: '',
            notes: '',
            missedDeadline: false
        };
        setPendingRows(prev => [...prev, newRow]);
    };

    const removePendingRow = (pendingId) => {
        setPendingRows(prev => prev.filter(row => row.id !== pendingId));
    };

    const commitPendingRow = async (pendingId) => {
        const pendingRow = pendingRows.find(row => row.id === pendingId);
        if (!pendingRow) return;

        try {
            const response = await fetch('/api/timelines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingRow)
            });

            if (!response.ok) throw new Error('Failed to create row');
            
            const result = await response.json();
            const newRow = { ...pendingRow, id: result.id };
            socket?.emit('create-timeline', newRow);
            
            removePendingRow(pendingId);
            handleRemoteCreate(newRow);
        } catch (err) {
            setError(err.message);
        }
    };

    const updateCell = async (rowId, field, value) => {
        const currentRow = data.find(row => row.id === rowId);
        if (!currentRow) return;

        const updatedRow = {
            ...currentRow,
            [field]: value
        };

        setEditedRows(prev => ({
            ...prev,
            [rowId]: {
                ...(prev[rowId] || {}),
                [field]: value
            }
        }));

        setData(prevData => 
            prevData.map(row => row.id === rowId ? updatedRow : row)
        );
    };

    const commitRowChanges = async (rowId) => {
        const updatedRow = {
            ...data.find(row => row.id === rowId),
            ...editedRows[rowId]
        };

        try {
            const response = await fetch(`/api/timelines/${rowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRow)
            });

            if (!response.ok) throw new Error('Failed to update row');
            
            socket?.emit('update-timeline', updatedRow);
            
            setEditedRows(prev => {
                const newState = { ...prev };
                delete newState[rowId];
                return newState;
            });
            
            setEditingCell(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteRow = async (rowId) => {
        try {
            const response = await fetch(`/api/timelines/${rowId}`, {
                method: 'DELETE'
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete row');
            }
    
            setData(prevData => prevData.filter(row => row.id !== rowId));
            socket?.emit('delete-timeline', rowId);
        } catch (error) {
            console.error('Error deleting row:', error);
            throw error; 
        }
    };

    const toggleMissedDeadline = async (rowId) => {
        try {
            const row = data.find(r => r.id === rowId);
            if (!row) return;
    
            const updatedRow = {
                ...row,
                missedDeadline: !row.missedDeadline
            };
    
            const response = await fetch(`/api/timelines/${rowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRow)
            });
    
            if (!response.ok) {
                throw new Error('Failed to update missed deadline');
            }
    
            setData(prevData => prevData.map(r => 
                r.id === rowId ? updatedRow : r
            ));
            socket?.emit('update-timeline', updatedRow);
        } catch (error) {
            console.error('Error updating missed deadline:', error);
            setData(prevData => [...prevData]);
        }
    };

    const cancelRowChanges = async (rowId) => {
        try {
            const response = await fetch(`/api/timelines/${rowId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch original row');
            }
            
            const originalRow = await response.json();
            setData(prevData => prevData.map(row => 
                row.id === rowId ? originalRow : row
            ));
            
            setEditedRows(prev => {
                const newState = { ...prev };
                delete newState[rowId];
                return newState;
            });
            
            setEditingCell(null);
        } catch (error) {
            console.error('Error canceling changes:', error);
        }
    };

    const value = {
        data,
        loading,
        error,
        editingCell,
        editedRows,
        pendingRows,
        filters,
        searchTerm,
        hasScrolledToCurrentWeek,
        setEditingCell,
        setFilters,
        setSearchTerm,
        setHasScrolledToCurrentWeek,
        addRow,
        removePendingRow,
        commitPendingRow,
        updateCell,
        commitRowChanges,
        cancelRowChanges,
        deleteRow,
        toggleMissedDeadline
    };

    return (
        <TimelineContext.Provider value={value}>
            {children}
        </TimelineContext.Provider>
    );
};

export default TimelineProvider;