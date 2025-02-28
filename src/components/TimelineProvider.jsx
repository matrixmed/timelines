import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import config from '../config';

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
    const [pendingEdits, setPendingEdits] = useState({});
    const [socket, setSocket] = useState(null);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [hasScrolledToCurrentWeek, setHasScrolledToCurrentWeek] = useState(false);
    
    const originalRowData = useRef({});
    const socketEvents = useRef({});

    useEffect(() => {
        const newSocket = io(config.socketUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected');
            newSocket.emit('join', 'timelines');
        });

        socketEvents.current = {
            update: (updatedRow) => {
                setData(prevData => {
                    return prevData.map(row => 
                        row.id === updatedRow.id ? updatedRow : row
                    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                });
                
                originalRowData.current[updatedRow.id] = { ...updatedRow };
            },
            
            delete: (id) => {
                setData(prevData => prevData.filter(row => row.id !== id));
                
                if (originalRowData.current[id]) {
                    const newOriginalData = { ...originalRowData.current };
                    delete newOriginalData[id];
                    originalRowData.current = newOriginalData;
                }
            },
            
            create: (newRow) => {
                setData(prevData => {
                    const newData = [...prevData, newRow];
                    
                    originalRowData.current[newRow.id] = { ...newRow };
                    
                    return newData.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                });
            }
        };

        newSocket.on('timeline-update', socketEvents.current.update);
        newSocket.on('timeline-delete', socketEvents.current.delete);
        newSocket.on('timeline-create', socketEvents.current.create);

        fetchData();

        return () => {
            newSocket.off('timeline-update', socketEvents.current.update);
            newSocket.off('timeline-delete', socketEvents.current.delete);
            newSocket.off('timeline-create', socketEvents.current.create);
            newSocket.disconnect();
        };
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.apiUrl}/api/timelines`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();
            
            const originalData = {};
            result.forEach(row => {
                originalData[row.id] = { ...row };
            });
            originalRowData.current = originalData;
            
            setData(result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);    

    const addRow = useCallback(() => {
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
        
        setPendingEdits(prev => ({
            ...prev,
            [newRow.id]: { ...newRow }
        }));
    }, []);

    const removePendingRow = useCallback((pendingId) => {
        setPendingRows(prev => prev.filter(row => row.id !== pendingId));
        
        setPendingEdits(prev => {
            const newEdits = { ...prev };
            delete newEdits[pendingId];
            return newEdits;
        });
    }, []);

    const commitPendingRow = useCallback(async (pendingId) => {
        const pendingRow = pendingEdits[pendingId];
        if (!pendingRow) return;

        try {
            const response = await fetch(`${config.apiUrl}/api/timelines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingRow)
            });

            if (!response.ok) throw new Error('Failed to create row');
            
            const result = await response.json();
            const newRow = { ...pendingRow, id: result.id };
            
            originalRowData.current[result.id] = { ...newRow };
            
            socket?.emit('create-timeline', newRow);
            
            removePendingRow(pendingId);
            
            setData(prevData => {
                const newData = [...prevData, newRow];
                return newData.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            });
        } catch (err) {
            setError(err.message);
        }
    }, [pendingEdits, socket, removePendingRow]);

    const updatePendingCell = useCallback((rowId, field, value) => {
        setPendingEdits(prev => ({
            ...prev,
            [rowId]: {
                ...(prev[rowId] || {}),
                [field]: value
            }
        }));
        
        setPendingRows(prev => 
            prev.map(row => row.id === rowId ? 
                { ...row, [field]: value } : 
                row
            )
        );
    }, []);

    const updateCell = useCallback((rowId, field, value) => {
        const currentRow = data.find(row => row.id === rowId);
        if (!currentRow) return;

        setEditedRows(prev => ({
            ...prev,
            [rowId]: {
                ...(prev[rowId] || {}),
                [field]: value
            }
        }));

        setData(prevData => 
            prevData.map(row => row.id === rowId ? 
                { ...row, [field]: value } : 
                row
            )
        );
    }, [data]);

    const commitRowChanges = useCallback(async (rowId) => {
        const currentRow = data.find(row => row.id === rowId);
        if (!currentRow) return;

        const updatedRow = {
            ...currentRow,
            ...editedRows[rowId]
        };

        try {
            const response = await fetch(`${config.apiUrl}/api/timelines/${rowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRow)
            });

            if (!response.ok) throw new Error('Failed to update row');
            
            originalRowData.current[rowId] = { ...updatedRow };
            
            socket?.emit('update-timeline', updatedRow);
            
            setEditedRows(prev => {
                const newState = { ...prev };
                delete newState[rowId];
                return newState;
            });
            
            setEditingCell(null);
        } catch (err) {
            setError(err.message);
            
            setData(prevData => 
                prevData.map(row => row.id === rowId ? 
                    originalRowData.current[rowId] : 
                    row
                )
            );
        }
    }, [data, editedRows, socket]);

    const deleteRow = useCallback(async (rowId) => {
        try {
            console.log("Deleting row with ID:", rowId);
            
            setData(prevData => prevData.filter(row => row.id !== rowId));
            
            const newOriginalData = { ...originalRowData.current };
            delete newOriginalData[rowId];
            originalRowData.current = newOriginalData;
            
            const response = await fetch(`${config.apiUrl}/api/timelines/${rowId}`, {
                method: 'DELETE'
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete row on server');
            }
            
            socket?.emit('delete-timeline', rowId);
            
            return true;
        } catch (error) {
            console.error('Error deleting row:', error);
            setError(`Failed to delete: ${error.message}`);
                        
            return false;
        }
    }, [socket]);

    const toggleMissedDeadline = useCallback(async (rowId) => {
        try {
            const row = data.find(r => r.id === rowId);
            if (!row) return;
    
            const updatedRow = {
                ...row,
                missedDeadline: !row.missedDeadline
            };
    
            setData(prevData => prevData.map(r => 
                r.id === rowId ? updatedRow : r
            ));
    
            const response = await fetch(`${config.apiUrl}/api/timelines/${rowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRow)
            });
    
            if (!response.ok) {
                throw new Error('Failed to update missed deadline');
            }
    
            originalRowData.current[rowId] = { ...updatedRow };
            
            socket?.emit('update-timeline', updatedRow);
        } catch (error) {
            console.error('Error updating missed deadline:', error);
            
            setData(prevData => prevData.map(r => 
                r.id === rowId ? originalRowData.current[rowId] : r
            ));
            
            setError(`Failed to update: ${error.message}`);
        }
    }, [data, socket]);

    const cancelRowChanges = useCallback((rowId) => {
        if (originalRowData.current[rowId]) {
            setData(prevData => prevData.map(row => 
                row.id === rowId ? originalRowData.current[rowId] : row
            ));
        }
        
        setEditedRows(prev => {
            const newState = { ...prev };
            delete newState[rowId];
            return newState;
        });
        
        setEditingCell(null);
    }, []);

    const value = {
        data,
        loading,
        error,
        editingCell,
        editedRows,
        pendingRows,
        pendingEdits,
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
        updatePendingCell,
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