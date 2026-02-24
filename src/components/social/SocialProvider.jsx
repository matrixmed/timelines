import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import config from '../../config';

const SocialContext = createContext(null);

const loadSocialFiltersFromStorage = () => {
  try {
    const savedFilters = localStorage.getItem('socialFilters');
    const savedSearchTerm = localStorage.getItem('socialSearchTerm');
    return {
      filters: savedFilters ? JSON.parse(savedFilters) : {},
      searchTerm: savedSearchTerm || ''
    };
  } catch (error) {
    console.error('Error loading social filters from localStorage:', error);
    return { filters: {}, searchTerm: '' };
  }
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editedRows, setEditedRows] = useState({});
  const [pendingRows, setPendingRows] = useState([]);
  const [pendingEdits, setPendingEdits] = useState({});
  const [socket, setSocket] = useState(null);

  const savedFilterState = loadSocialFiltersFromStorage();
  const [filters, setFilters] = useState(savedFilterState.filters);
  const [searchTerm, setSearchTerm] = useState(savedFilterState.searchTerm);

  const originalRowData = useRef({});
  const socketEvents = useRef({});

  useEffect(() => {
    try {
      localStorage.setItem('socialFilters', JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving social filters to localStorage:', error);
    }
  }, [filters]);

  useEffect(() => {
    try {
      localStorage.setItem('socialSearchTerm', searchTerm);
    } catch (error) {
      console.error('Error saving social search term to localStorage:', error);
    }
  }, [searchTerm]);

  useEffect(() => {
    const newSocket = io(config.socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Social socket connected');
      newSocket.emit('join', 'timelines');
    });

    socketEvents.current = {
      update: (updatedRow) => {
        setData(prevData => {
          const exists = prevData.some(row => row.id === updatedRow.id);
          if (exists) {
            return prevData.map(row =>
              row.id === updatedRow.id ? updatedRow : row
            ).sort((a, b) => {
              if (!a.postDate && !b.postDate) return 0;
              if (!a.postDate) return -1;
              if (!b.postDate) return 1;
              return new Date(a.postDate) - new Date(b.postDate);
            });
          }
          return [...prevData, updatedRow].sort((a, b) => {
            if (!a.postDate && !b.postDate) return 0;
            if (!a.postDate) return -1;
            if (!b.postDate) return 1;
            return new Date(a.postDate) - new Date(b.postDate);
          });
        });
        originalRowData.current[updatedRow.id] = { ...updatedRow };
      },
      delete: (id) => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        setData(prevData => prevData.filter(row => row.id !== numId));
        delete originalRowData.current[numId];
      },
      create: (newRow) => {
        setData(prevData => {
          const newData = [...prevData, newRow];
          originalRowData.current[newRow.id] = { ...newRow };
          return newData.sort((a, b) => {
            if (!a.postDate && !b.postDate) return 0;
            if (!a.postDate) return -1;
            if (!b.postDate) return 1;
            return new Date(a.postDate) - new Date(b.postDate);
          });
        });
      }
    };

    newSocket.on('social-update', socketEvents.current.update);
    newSocket.on('social-delete', socketEvents.current.delete);
    newSocket.on('social-create', socketEvents.current.create);

    fetchData();

    return () => {
      newSocket.off('social-update', socketEvents.current.update);
      newSocket.off('social-delete', socketEvents.current.delete);
      newSocket.off('social-create', socketEvents.current.create);
      newSocket.disconnect();
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/api/social`);
      if (!response.ok) throw new Error('Failed to fetch social data');
      const result = await response.json();
      const originalData = {};
      result.forEach(row => {
        originalData[row.id] = { ...row };
      });
      originalRowData.current = originalData;
      setData(result.sort((a, b) => {
        if (!a.postDate && !b.postDate) return 0;
        if (!a.postDate) return -1;
        if (!b.postDate) return 1;
        return new Date(a.postDate) - new Date(b.postDate);
      }));
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
      details: '',
      brand: '',
      content: '',
      platforms: '[]',
      postDate: '',
      status: 'In Progress',
      owner: '',
      notes: '',
      linkedTimelineId: null,
      linkedDateOffset: 0,
      linkedRowDeleted: false
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
      const rowToSubmit = { ...pendingRow };
      if (rowToSubmit.postDate === '') {
        rowToSubmit.postDate = null;
      }

      const response = await fetch(`${config.apiUrl}/api/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowToSubmit)
      });

      if (!response.ok) throw new Error('Failed to create social post');

      const result = await response.json();
      const newRow = { ...pendingRow, id: result.id };
      originalRowData.current[result.id] = { ...newRow };
      socket?.emit('create-social', newRow);

      removePendingRow(pendingId);
      setData(prevData => {
        const newData = [...prevData, newRow];
        return newData.sort((a, b) => new Date(a.postDate || '3000-01-01') - new Date(b.postDate || '3000-01-01'));
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

    return true;
  }, [data]);

  const clearEditForField = useCallback((rowId, field) => {
    setEditedRows(prev => {
      if (!prev[rowId]) return prev;
      const newEdits = { ...prev[rowId] };
      delete newEdits[field];
      if (Object.keys(newEdits).length === 0) {
        const result = { ...prev };
        delete result[rowId];
        return result;
      }
      return { ...prev, [rowId]: newEdits };
    });
  }, []);

  const commitRowChanges = useCallback(async (rowId) => {
    const currentRow = data.find(row => row.id === rowId);
    if (!currentRow) return;

    const rowEdits = editedRows[rowId] || {};
    if (Object.keys(rowEdits).length === 0) return;

    const updatedRow = {
      ...currentRow,
      ...rowEdits
    };

    try {
      const response = await fetch(`${config.apiUrl}/api/social/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow)
      });

      if (!response.ok) throw new Error('Failed to update social post');

      originalRowData.current[rowId] = { ...updatedRow };
      socket?.emit('update-social', updatedRow);

      setEditedRows(prev => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });

      setEditingCell(null);
      return true;
    } catch (err) {
      console.error('Error saving social changes:', err);
      setError(err.message);

      setData(prevData =>
        prevData.map(row => row.id === rowId ?
          originalRowData.current[rowId] :
          row
        )
      );

      return false;
    }
  }, [data, editedRows, socket]);

  const deleteRow = useCallback(async (rowId) => {
    try {
      setData(prevData => prevData.filter(row => row.id !== rowId));
      delete originalRowData.current[rowId];

      const response = await fetch(`${config.apiUrl}/api/social/${rowId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete social post');

      socket?.emit('delete-social', rowId);
      return true;
    } catch (error) {
      console.error('Error deleting social post:', error);
      setError(`Failed to delete: ${error.message}`);
      return false;
    }
  }, [socket]);

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

  const dismissLinkedRowWarning = useCallback(async (rowId) => {
    try {
      const currentRow = data.find(row => row.id === rowId);
      if (!currentRow) return;

      const updatedRow = { ...currentRow, linkedRowDeleted: false };

      const response = await fetch(`${config.apiUrl}/api/social/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow)
      });

      if (!response.ok) throw new Error('Failed to dismiss warning');

      setData(prevData =>
        prevData.map(row => row.id === rowId ? updatedRow : row)
      );
      originalRowData.current[rowId] = { ...updatedRow };
      socket?.emit('update-social', updatedRow);
    } catch (err) {
      console.error('Error dismissing linked row warning:', err);
    }
  }, [data, socket]);

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
    socket,
    setEditingCell,
    setFilters,
    setSearchTerm,
    addRow,
    removePendingRow,
    commitPendingRow,
    updateCell,
    updatePendingCell,
    commitRowChanges,
    cancelRowChanges,
    deleteRow,
    clearEditForField,
    dismissLinkedRowWarning
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};
