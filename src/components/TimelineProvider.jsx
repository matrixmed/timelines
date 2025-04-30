import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { fetchDropdownOptions, addUniqueValue } from './fields';
import io from 'socket.io-client';
import config from '../config';

const TimelineContext = createContext(null);

// Load filters from localStorage
const loadFiltersFromStorage = () => {
  try {
    const savedFilters = localStorage.getItem('timelineFilters');
    const savedSearchTerm = localStorage.getItem('timelineSearchTerm');
    return { 
      filters: savedFilters ? JSON.parse(savedFilters) : {},
      searchTerm: savedSearchTerm || ''
    };
  } catch (error) {
    console.error('Error loading filters from localStorage:', error);
    return { filters: {}, searchTerm: '' };
  }
};

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
  
  // Load saved filters from localStorage
  const savedFilterState = loadFiltersFromStorage();
  const [filters, setFilters] = useState(savedFilterState.filters);
  const [searchTerm, setSearchTerm] = useState(savedFilterState.searchTerm);
  
  const [hasScrolledToCurrentWeek, setHasScrolledToCurrentWeek] = useState(false);
  const [tableScrollPosition, setTableScrollPosition] = useState(0);
  const originalRowData = useRef({});
  const socketEvents = useRef({});

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('timelineFilters', JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters]);

  // Save search term to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('timelineSearchTerm', searchTerm);
    } catch (error) {
      console.error('Error saving search term to localStorage:', error);
    }
  }, [searchTerm]);

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
          ).sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return -1;
            if (!b.dueDate) return 1;
            
            return new Date(a.dueDate) - new Date(b.dueDate);
          });
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
          return newData.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return -1;
            if (!b.dueDate) return 1;
            
            return new Date(a.dueDate) - new Date(b.dueDate);
          });
        });
      }
    };
    
    newSocket.on('timeline-update', socketEvents.current.update);
    newSocket.on('timeline-delete', socketEvents.current.delete);
    newSocket.on('timeline-create', socketEvents.current.create);
    
    fetchData();
    fetchDropdownOptions();
    
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
      setData(result.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return -1;
        if (!b.dueDate) return 1;
        
        return new Date(a.dueDate) - new Date(b.dueDate);
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
      market: '',
      clientSponsor: '',
      project: '',
      dueDate: '',
      task: '',
      complete: false,
      team: '',
      me: '',
      bd: '',
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

  const addRowWithData = useCallback((initialData) => {
    const newRow = {
      id: `pending-${Date.now()}`,
      market: initialData.market || '',
      clientSponsor: initialData.clientSponsor || '',
      project: initialData.project || '',
      dueDate: initialData.dueDate || '',
      task: initialData.task || '',
      complete: initialData.complete || false,
      team: initialData.team || '',
      me: initialData.me || '',
      bd: initialData.bd || '',
      deployment: initialData.deployment || '',
      notes: initialData.notes || '',
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
      if (pendingRow.market) addUniqueValue('market', pendingRow.market);
      if (pendingRow.clientSponsor) addUniqueValue('clientSponsor', pendingRow.clientSponsor);
      if (pendingRow.project) addUniqueValue('project', pendingRow.project);
      
      const rowToSubmit = { ...pendingRow };
      
      if (rowToSubmit.dueDate === '') {
        rowToSubmit.dueDate = null;
      }
      
      const response = await fetch(`${config.apiUrl}/api/timelines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowToSubmit)
      });
      
      fetchDropdownOptions();
      
      if (!response.ok) throw new Error('Failed to create row');
      
      const result = await response.json();
      const newRow = { ...pendingRow, id: result.id };
      originalRowData.current[result.id] = { ...newRow };
      socket?.emit('create-timeline', newRow);
      
      removePendingRow(pendingId);
      setData(prevData => {
        const newData = [...prevData, newRow];
        return newData.sort((a, b) => new Date(a.dueDate || '3000-01-01') - new Date(b.dueDate || '3000-01-01'));
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
    
    if (['market', 'clientSponsor', 'project'].includes(field) && value) {
      addUniqueValue(field, value);
    }
    
    // Update the editedRows state with the new value
    setEditedRows(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [field]: value
      }
    }));
    
    // Update the displayed data immediately
    setData(prevData =>
      prevData.map(row => row.id === rowId ?
        { ...row, [field]: value } :
        row
      )
    );
    
    // For checkbox, return true to ensure it stays checked in the UI
    return true;
  }, [data]);

  // New function to clear edited state for a specific field
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
      
      return {
        ...prev,
        [rowId]: newEdits
      };
    });
  }, []);

  const commitRowChanges = useCallback(async (rowId) => {
    const currentRow = data.find(row => row.id === rowId);
    if (!currentRow) return;
    
    // Get the current edits for this row
    const rowEdits = editedRows[rowId] || {};
    if (Object.keys(rowEdits).length === 0) return; // Nothing to save
    
    const updatedRow = {
      ...currentRow,
      ...rowEdits
    };
    
    try {
      console.log("Committing changes for row:", rowId, updatedRow);
      
      const response = await fetch(`${config.apiUrl}/api/timelines/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow)
      });
      
      if (!response.ok) throw new Error('Failed to update row');
      
      // Update our reference to the original data
      originalRowData.current[rowId] = { ...updatedRow };
      
      // Notify other clients
      socket?.emit('update-timeline', updatedRow);
      
      // Update dropdown options if needed
      fetchDropdownOptions();
      
      // Clear edited state for this row since changes are saved
      setEditedRows(prev => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
      
      // Exit edit mode
      setEditingCell(null);
      
      return true;
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err.message);
      
      // Revert to original data on error
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
      
      fetchDropdownOptions();
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
      
      // Update UI immediately
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
    tableScrollPosition,
    socket,
    setEditingCell,
    setFilters,
    setSearchTerm,
    setHasScrolledToCurrentWeek,
    setTableScrollPosition,
    addRow,
    addRowWithData,
    removePendingRow,
    commitPendingRow,
    updateCell,
    updatePendingCell,
    commitRowChanges,
    cancelRowChanges,
    deleteRow,
    toggleMissedDeadline,
    clearEditForField
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};