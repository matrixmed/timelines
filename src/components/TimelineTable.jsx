import React, { useRef, useEffect, useCallback, memo, useState } from 'react';
import { useTimeline } from './TimelineProvider';
import NewTimelineRow from './NewTimelineRow';
import { Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { markets, clients, projects } from './fields';
import { colorConfig } from './ColorConfig';
import { applyFilters } from './TimelineFilters';
import config from '../config';

const fixDateOffset = (dateString) => {
    if (!dateString) return '';
    
    let date;
    
    if (dateString instanceof Date) {
      date = new Date(dateString);
    } 
    else if (typeof dateString === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        const parts = new Date(dateString).toISOString().split('T')[0].split('-');
        date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      }
    } else {
      return dateString;
    }
    
    return date;
};
  
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    try {
      const date = fixDateOffset(dateStr);
      
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return dateStr;
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
};

const isInSameWeek = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    const weekStart1 = new Date(d1);
    weekStart1.setDate(d1.getDate() - d1.getDay());
    
    const weekStart2 = new Date(d2);
    weekStart2.setDate(d2.getDate() - d2.getDay());
    
    return weekStart1.getTime() === weekStart2.getTime();
};

const Cell = memo(({ 
    field, 
    value, 
    row, 
    isPending, 
    isEditing, 
    onCellClick, 
    onValueChange,
    getCellStyle,
    getColoredContentStyle,
    getSelectOptions,
    commitChanges,
    cancelChanges,
    clearEditForField,
    socket
}) => {
    const cellStyle = getCellStyle(field, value, row);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef(null);
    
    useEffect(() => {
        setLocalValue(value);
    }, [value]);
    
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);
    
    if (isEditing) {
        // Auto-save on blur for all fields
        const handleBlur = () => {
            if (!isPending) {
                commitChanges(row.id);
            }
        };

        // Handle keyboard events for all fields
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitChanges(row.id);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelChanges(row.id);
            }
        };

        const commonProps = {
            autoFocus: true,
            className: `cell-${field === 'dueDate' ? 'date-input' : field === 'task' || field === 'notes' ? 'textarea' : 'input'}`,
            ref: inputRef,
            onBlur: handleBlur,
            onKeyDown: handleKeyDown
        };

        // Handle dropdown fields (Market, Client/Sponsor, Project)
        if (['market', 'clientSponsor', 'project'].includes(field)) {
            const getDisplayName = (fieldName) => {
                switch (fieldName) {
                    case 'clientSponsor': return 'client';
                    default: return fieldName;
                }
            };
            
            return (
                <div>
                    <select
                        value={localValue || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setLocalValue(newValue);
                            onValueChange(newValue);
                            
                            // Auto-save dropdown changes immediately
                            setTimeout(() => {
                                commitChanges(row.id);
                            }, 50);
                        }}
                        className="cell-select"
                        style={cellStyle}
                        {...commonProps}
                    >
                        <option value="">Select {getDisplayName(field)}</option>
                        {getSelectOptions(field).map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            );
        }

        // Handle complete checkbox
        if (field === 'complete') {
            const handleCheckboxChange = (e) => {
                const newValue = e.target.checked;
                setLocalValue(newValue);
                onValueChange(newValue);
                
                // Immediately save checkbox changes
                setTimeout(() => {
                    commitChanges(row.id);
                }, 50);
            };
            
            return (
                <div>
                    <input
                        type="checkbox"
                        checked={localValue || false}
                        onChange={handleCheckboxChange}
                        className="cell-checkbox"
                    />
                </div>
            );
        }

        // Handle date field
        if (field === 'dueDate') {
            return (
                <div className="date-picker-container">
                    <input
                        type="date"
                        value={localValue || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setLocalValue(newValue);
                            onValueChange(newValue);
                        }}
                        {...commonProps}
                    />
                </div>
            );
        }

        // Handle text areas (task, notes)
        if (field === 'task' || field === 'notes') {
            return (
                <div>
                    <textarea
                        value={localValue || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setLocalValue(newValue);
                            onValueChange(newValue);
                        }}
                        {...commonProps}
                    />
                </div>
            );
        }

        // Handle all other text fields
        return (
            <div>
                <input
                    type="text"
                    value={localValue || ''}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setLocalValue(newValue);
                        onValueChange(newValue);
                    }}
                    {...commonProps}
                />
            </div>
        );
    }

    // Special handling for complete checkbox in view mode
    if (field === 'complete') {
        // Direct checkbox click handler with immediate save to database
        const handleCompleteChange = (e) => {
            const newValue = e.target.checked;
            
            // First modify our local state to show the change
            onValueChange(newValue);
            
            // Then immediately save to database without showing any pending UI
            setTimeout(() => {
                // Direct API call for completeness change to avoid filtering issues
                const updateCompletionStatus = async () => {
                    try {
                        const updatedRow = {
                            ...row,
                            complete: newValue
                        };
                        
                        // Make a direct API call
                        const response = await fetch(`${config.apiUrl}/api/timelines/${row.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedRow)
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to update completion status');
                        }
                        
                        // Emit the socket event for other clients
                        socket?.emit('update-timeline', updatedRow);
                        
                        // Clear any edited state
                        clearEditForField?.(row.id, 'complete');
                    } catch (error) {
                        console.error('Error updating completion status:', error);
                    }
                };
                
                updateCompletionStatus();
            }, 10);
        };

        return (
            <input
                type="checkbox"
                checked={value || false}
                onChange={handleCompleteChange}
                className="cell-checkbox"
            />
        );
    }

    // Colored styles for certain fields
    const coloredStyle = getColoredContentStyle(field, value);
    
    if (coloredStyle && ['market', 'clientSponsor', 'project'].includes(field)) {
        return (
            <div
                className={`cell-content ${(field === 'task' || field === 'notes') ? 'cell-content-multiline' : ''}`}
                style={cellStyle}
                onClick={() => !isPending && onCellClick()}
            >
                <div style={coloredStyle}>
                    {value}
                </div>
            </div>
        );
    }
    
    // Default content display
    return (
        <div
            className={`cell-content ${(field === 'task' || field === 'notes') ? 'cell-content-multiline' : ''}`}
            style={cellStyle}
            onClick={() => !isPending && onCellClick()}
        >
            {field === 'dueDate' ? formatDate(value) : value}
        </div>
    );
});

const TableRow = memo(({ 
    row, 
    isPending, 
    editingCell,
    editedRows,
    renderActionButtons,
    getCellStyle,
    getColoredContentStyle,
    getSelectOptions,
    getRowStyle,
    setEditingCell,
    updateCell,
    updatePendingCell,
    commitRowChanges,
    cancelRowChanges,
    clearEditForField,
    socket
}) => {
    return (
        <tr 
            style={getRowStyle(row)}
            className={`${editedRows[row.id] ? 'row-edited' : ''}`}
        >
            {['market', 'clientSponsor', 'project', 'dueDate', 'task', 
            'complete', 'team', 'me', 'bd', 'deployment', 'notes'].map(field => (
                <td key={field} className={`cell ${field === 'complete' ? 'center' : ''}`}>
                    <Cell 
                        field={field}
                        value={row[field]}
                        row={row}
                        isPending={isPending}
                        isEditing={(isPending && row.id.toString().startsWith('pending-')) || 
                                (!isPending && editingCell?.rowId === row.id && editingCell?.field === field)}
                        onCellClick={() => setEditingCell({ rowId: row.id, field })}
                        onValueChange={(value) => isPending ? 
                            updatePendingCell(row.id, field, value) : 
                            updateCell(row.id, field, value)}
                        getCellStyle={getCellStyle}
                        getColoredContentStyle={getColoredContentStyle}
                        getSelectOptions={getSelectOptions}
                        commitChanges={commitRowChanges}
                        cancelChanges={cancelRowChanges}
                        clearEditForField={clearEditForField}
                        socket={socket}
                    />
                </td>
            ))}
            <td className="cell center">
                {renderActionButtons(row, isPending)}
            </td>
        </tr>
    );
});

export const TimelineTable = ({ onDeleteClick }) => {
    const {
        data,
        filters,
        searchTerm,
        editingCell,
        editedRows,
        pendingRows,
        pendingEdits,
        hasScrolledToCurrentWeek,
        setEditingCell,
        setHasScrolledToCurrentWeek,
        updateCell,
        updatePendingCell,
        commitRowChanges,
        cancelRowChanges,
        toggleMissedDeadline,
        commitPendingRow,
        removePendingRow,
        tableScrollPosition,
        setTableScrollPosition,
        clearEditForField,
        socket
    } = useTimeline();
    
    const filteredData = React.useMemo(() => 
        applyFilters(data, filters, searchTerm), 
        [data, filters, searchTerm]
    );

    const tableRef = useRef(null);
    const editingRef = useRef(null);

    // Restore scroll position when component mounts
    useEffect(() => {
        if (tableRef.current && tableScrollPosition) {
            setTimeout(() => {
                tableRef.current.scrollTop = tableScrollPosition;
            }, 0);
        }

        // Save scroll position when component unmounts or view changes
        return () => {
            if (tableRef.current) {
                setTableScrollPosition(tableRef.current.scrollTop);
            }
        };
    }, [setTableScrollPosition, tableScrollPosition]);

    useEffect(() => {
        if (!hasScrolledToCurrentWeek && data.length > 0) {
            scrollToCurrentWeek();
            setHasScrolledToCurrentWeek(true);
        }
    }, [data, hasScrolledToCurrentWeek, setHasScrolledToCurrentWeek]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (editingRef.current && !editingRef.current.contains(event.target)) {
                if (editingCell) {
                    // Always auto-save on click outside for regular rows
                    if (!editingCell.rowId.toString().startsWith('pending-')) {
                        commitRowChanges(editingCell.rowId);
                    }
                    setEditingCell(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingCell, setEditingCell, commitRowChanges]);

    const columnOrder = [
        'market', 'clientSponsor', 'project', 'dueDate', 'task',
        'complete', 'team', 'me', 'bd', 'deployment', 'notes'
    ];

    const handleKeyDown = useCallback((e) => {
        if (!editingCell) return;

        const { rowId, field } = editingCell;
        const currentColIndex = columnOrder.indexOf(field);
        
        const allRows = [...pendingRows, ...filteredData];
        const currentRowIndex = allRows.findIndex(row => row.id === rowId);
        
        switch (e.key) {
            case 'Escape':
                if (editedRows[rowId]) {
                    cancelRowChanges(rowId);
                } else {
                    setEditingCell(null);
                }
                e.preventDefault();
                break;
                
            case 'Enter':
                if (e.shiftKey) {
                    if (currentRowIndex > 0) {
                        const prevRow = allRows[currentRowIndex - 1];
                        setEditingCell({ rowId: prevRow.id, field });
                    }
                } else {
                    // Auto-save on enter
                    if (editedRows[rowId]) {
                        commitRowChanges(rowId);
                    }
                    
                    if (currentRowIndex < allRows.length - 1) {
                        const nextRow = allRows[currentRowIndex + 1];
                        setEditingCell({ rowId: nextRow.id, field });
                    }
                }
                e.preventDefault();
                break;
                
            case 'Tab':
                if (e.shiftKey) {
                    if (currentColIndex > 0) {
                        setEditingCell({ rowId, field: columnOrder[currentColIndex - 1] });
                    } else if (currentRowIndex > 0) {
                        const prevRow = allRows[currentRowIndex - 1];
                        setEditingCell({ 
                            rowId: prevRow.id, 
                            field: columnOrder[columnOrder.length - 1] 
                        });
                    }
                } else {
                    if (currentColIndex < columnOrder.length - 1) {
                        setEditingCell({ rowId, field: columnOrder[currentColIndex + 1] });
                    } else if (currentRowIndex < allRows.length - 1) {
                        const nextRow = allRows[currentRowIndex + 1];
                        setEditingCell({ rowId: nextRow.id, field: columnOrder[0] });
                    }
                }
                e.preventDefault();
                break;
                
            case 'ArrowRight':
                if (currentColIndex < columnOrder.length - 1) {
                    setEditingCell({ rowId, field: columnOrder[currentColIndex + 1] });
                }
                e.preventDefault();
                break;
                
            case 'ArrowLeft':
                if (currentColIndex > 0) {
                    setEditingCell({ rowId, field: columnOrder[currentColIndex - 1] });
                }
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                if (currentRowIndex < allRows.length - 1) {
                    const nextRow = allRows[currentRowIndex + 1];
                    setEditingCell({ rowId: nextRow.id, field });
                }
                e.preventDefault();
                break;
                
            case 'ArrowUp':
                if (currentRowIndex > 0) {
                    const prevRow = allRows[currentRowIndex - 1];
                    setEditingCell({ rowId: prevRow.id, field });
                }
                e.preventDefault();
                break;
                
            default:
                break;
        }
    }, [editingCell, columnOrder, pendingRows, filteredData, editedRows, cancelRowChanges, setEditingCell, commitRowChanges]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const scrollToCurrentWeek = useCallback(() => {
        if (!tableRef.current) return;
        
        const today = new Date();
        const currentWeekRow = Array.from(tableRef.current.querySelectorAll('tbody tr')).find(row => {
            const dateCell = row.querySelector('td:nth-child(4)');
            if (!dateCell) return false;
            const cellText = dateCell.textContent;
            if (!cellText) return false;
            const rowDate = new Date(cellText);
            return !isNaN(rowDate) && isInSameWeek(today, rowDate);
        });

        if (currentWeekRow) {
            currentWeekRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    const getCellStyle = useCallback((field, value, row) => {
        const baseStyle = {
            transition: 'all 0.2s ease',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0'
        };

        if (field === 'dueDate' && row?.missedDeadline) {
            return { ...baseStyle, color: '#ef4444' };
        }

        const colorMappings = {
            market: colorConfig.markets,
            clientSponsor: colorConfig.clients,
            project: colorConfig.projects
        };

        if (colorMappings[field] && value) {
            const bgColor = colorMappings[field][value];
            if (bgColor) {
                return baseStyle;
            }
        }

        return baseStyle;
    }, []);
    
    const getColoredContentStyle = useCallback((field, value) => {
        const colorMappings = {
            market: colorConfig.markets,
            clientSponsor: colorConfig.clients,
            project: colorConfig.projects
        };
        
        if (colorMappings[field] && value) {
            const bgColor = colorMappings[field][value];
            if (bgColor) {
                return {
                    backgroundColor: bgColor,
                    color: colorConfig.getContrastText(bgColor),
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    margin: '4px 3px',
                    maxWidth: '95%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                };
            }
        }
        
        return null;
    }, []);

    const getRowStyle = useCallback((row) => {
        const today = new Date();
        const rowDate = new Date(row.dueDate);
        const isCurrentWeek = isInSameWeek(today, rowDate);
        
        return {
            backgroundColor: isCurrentWeek ? colorConfig.getColor('status', 'currentWeek') : 'inherit',
            position: 'relative',
            transition: 'all 0.2s ease'
        };
    }, []);

    const getSelectOptions = useCallback((field) => {
        switch (field) {
            case 'market': return markets;
            case 'clientSponsor': return clients;
            case 'project': return projects;
            default: return [];
        }
    }, []);

    const renderActionButtons = useCallback((row, isPending = false) => {
        if (isPending) {
            const handleSave = () => {
                commitPendingRow(row.id);
            };
            
            const handleCancel = () => {
                removePendingRow(row.id);
            };
            
            return (
                <div className="action-buttons">
                    <button 
                        className="action-button submit"
                        onClick={handleSave}
                        title="Save Changes"
                    >
                        <Check size={18} />
                    </button>
                    <button 
                        className="action-button cancel"
                        onClick={handleCancel}
                        title="Cancel Changes"
                    >
                        <X size={18} />
                    </button>
                </div>
            );
        }
        
        return (
            <div className="action-buttons">
                <button 
                    className={`action-button deadline-toggle ${row.missedDeadline ? 'active' : ''}`}
                    onClick={() => toggleMissedDeadline(row.id)}
                    title="Toggle Missed Deadline"
                >
                    <AlertCircle size={18} />
                </button>
                <button 
                    className="action-button delete"
                    onClick={() => onDeleteClick(row)}
                    title="Delete Row"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        );
    }, [commitPendingRow, removePendingRow, toggleMissedDeadline, onDeleteClick]);

    return (
        <div className="table-container" ref={tableRef}>
            {pendingRows.length > 0 && (
                <div className="pending-rows-container">
                    {pendingRows.map(row => (
                    <NewTimelineRow 
                        key={row.id} 
                        row={row}
                        onClose={() => removePendingRow(row.id)}
                    />
                    ))}
                </div>
            )}        
            <table className="timelines-table">
                <thead className="sticky-header">
                    <tr>
                        {['Market', 'Client/Brand', 'Project', 'Due Date', 'Task', 'Complete', 
                        'Team', 'ME', 'BD', 'Deployment', 'Notes', 'Actions'].map(header => (
                            <th key={header}>
                                <div className="header-content">
                                    <span className="header-text">{header}</span>
                                    {header !== 'Actions' && 
                                        <span className="header-filter-icon" data-column={header}>
                                        </span>
                                    }
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map(row => (
                        <TableRow 
                            key={row.id}
                            row={row}
                            isPending={false}
                            editingCell={editingCell}
                            editedRows={editedRows}
                            renderActionButtons={renderActionButtons}
                            getCellStyle={getCellStyle}
                            getColoredContentStyle={getColoredContentStyle}
                            getSelectOptions={getSelectOptions}
                            getRowStyle={getRowStyle}
                            setEditingCell={setEditingCell}
                            updateCell={updateCell}
                            updatePendingCell={updatePendingCell}
                            commitRowChanges={commitRowChanges}
                            cancelRowChanges={cancelRowChanges}
                            clearEditForField={clearEditForField}
                            socket={socket}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimelineTable;