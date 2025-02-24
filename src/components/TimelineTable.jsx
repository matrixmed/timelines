import React, { useRef, useEffect } from 'react';
import { useTimeline } from './TimelineProvider';
import { Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { markets, clients, projects } from './fields';
import { colorConfig } from './ColorConfig';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const isInSameWeek = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    const weekStart1 = new Date(d1);
    weekStart1.setDate(d1.getDate() - d1.getDay() + (d1.getDay() === 0 ? -6 : 1));
    const weekStart2 = new Date(d2);
    weekStart2.setDate(d2.getDate() - d2.getDay() + (d2.getDay() === 0 ? -6 : 1));
    
    return weekStart1.getTime() === weekStart2.getTime();
};

export const TimelineTable = ({ onDeleteClick }) => {
    const {
        data,
        editingCell,
        editedRows,
        pendingRows,
        hasScrolledToCurrentWeek,
        setEditingCell,
        setHasScrolledToCurrentWeek,
        updateCell,
        commitRowChanges,
        cancelRowChanges,
        toggleMissedDeadline,
        commitPendingRow,
        removePendingRow
    } = useTimeline();

    const tableRef = useRef(null);
    const editingRef = useRef(null);

    useEffect(() => {
        if (!hasScrolledToCurrentWeek && data.length > 0) {
            scrollToCurrentWeek();
            setHasScrolledToCurrentWeek(true);
        }
    }, [data, hasScrolledToCurrentWeek]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (editingRef.current && !editingRef.current.contains(event.target)) {
                if (editingCell && !editedRows[editingCell.rowId]) {
                    setEditingCell(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingCell, editedRows]);

    const scrollToCurrentWeek = () => {
        if (!tableRef.current) return;
        
        const today = new Date();
        const currentWeekRow = Array.from(tableRef.current.querySelectorAll('tr')).find(row => {
            const dateCell = row.querySelector('td:nth-child(4)');
            if (!dateCell) return false;
            const rowDate = new Date(dateCell.textContent);
            return isInSameWeek(today, rowDate);
        });

        if (currentWeekRow) {
            currentWeekRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getCellStyle = (field, value, row) => {
        const baseStyle = {
            transition: 'all 0.2s ease',
            height: '100%',
            display: 'flex',
            alignItems: 'center'
        };

        if (field === 'dueDate' && row.missedDeadline) {
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
                return {
                    ...baseStyle,
                    backgroundColor: bgColor,
                    color: colorConfig.getContrastText(bgColor)
                };
            }
        }

        return baseStyle;
    };

    const getRowStyle = (row) => {
        const today = new Date();
        const rowDate = new Date(row.dueDate);
        const isCurrentWeek = isInSameWeek(today, rowDate);
        
        return {
            backgroundColor: isCurrentWeek ? colorConfig.getColor('status', 'currentWeek') : 'inherit',
            position: 'relative',
            transition: 'all 0.2s ease'
        };
    };

    const getSelectOptions = (field) => {
        switch (field) {
            case 'market': return markets;
            case 'clientSponsor': return clients;
            case 'project': return projects;
            default: return [];
        }
    };

    const renderCell = (row, field, isPending = false) => {
        const cellStyle = getCellStyle(field, row[field], row);
        const isEditing = (isPending && row.id.toString().startsWith('pending-')) || 
                        (!isPending && editingCell?.rowId === row.id && editingCell?.field === field);

        if (isEditing) {
            const handleChange = (value) => {
                if (isPending) {
                    const updatedRow = { ...row, [field]: value };
                    if (row.id.toString().startsWith('pending-')) {
                        removePendingRow(row.id);
                        commitPendingRow(updatedRow);
                    }
                } else {
                    updateCell(row.id, field, value);
                }
            };

            const commonProps = {
                ref: editingRef,
                autoFocus: true,
                className: `cell-${field === 'dueDate' ? 'date-input' : field === 'task' || field === 'notes' ? 'textarea' : 'input'}`
            };

            if (['market', 'clientSponsor', 'project'].includes(field)) {
                return (
                    <div ref={editingRef}>
                        <select
                            value={row[field] || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            className="cell-select"
                            style={cellStyle}
                            autoFocus
                        >
                            <option value="">Select {field}</option>
                            {getSelectOptions(field).map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                );
            }

            if (field === 'complete') {
                return (
                    <div ref={editingRef}>
                        <input
                            type="checkbox"
                            checked={row[field]}
                            onChange={(e) => handleChange(e.target.checked)}
                            className="cell-checkbox"
                        />
                    </div>
                );
            }

            if (field === 'dueDate') {
                return (
                    <div ref={editingRef} className="date-picker-container">
                        <input
                            type="date"
                            value={row[field] || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            {...commonProps}
                        />
                    </div>
                );
            }

            if (field === 'task' || field === 'notes') {
                return (
                    <div ref={editingRef}>
                        <textarea
                            value={row[field] || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            {...commonProps}
                        />
                    </div>
                );
            }

            return (
                <div ref={editingRef}>
                    <input
                        type="text"
                        value={row[field] || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        {...commonProps}
                    />
                </div>
            );
        }

        if (field === 'complete') {
            return (
                <input
                    type="checkbox"
                    checked={row[field]}
                    onChange={(e) => updateCell(row.id, field, e.target.checked)}
                    className="cell-checkbox"
                />
            );
        }

        return (
            <div
                className={`cell-content ${(field === 'task' || field === 'notes') ? 'cell-content-multiline' : ''}`}
                style={cellStyle}
                onClick={() => !isPending && setEditingCell({ rowId: row.id, field })}
            >
                {field === 'dueDate' ? formatDate(row[field]) : row[field]}
            </div>
        );
    };

    const renderActionButtons = (row) => {
        if (editedRows[row.id]) {
            return (
                <div className="action-buttons">
                    <button 
                        className="action-button submit"
                        onClick={() => commitRowChanges(row.id)}
                        title="Save Changes"
                    >
                        <Check size={18} />
                    </button>
                    <button 
                        className="action-button cancel"
                        onClick={() => cancelRowChanges(row.id)}
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
    };

    return (
        <div className="table-container" ref={tableRef}>
            <table className="timelines-table">
                <thead className="sticky-header">
                    <tr>
                        {['Market', 'Client/Sponsor', 'Project', 'Due Date', 'Task', 'Complete', 
                        'Team', 'ME', 'Deployment', 'Notes', 'Actions'].map(header => (
                            <th key={header}>
                                <div className="header-content">
                                    {header}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                {pendingRows.length > 0 && (
                    <tbody className="pending-rows-container">
                        {pendingRows.map(row => (
                            <tr key={row.id} className="pending-row">
                                {['market', 'clientSponsor', 'project', 'dueDate', 'task', 
                                'complete', 'team', 'me', 'deployment', 'notes'].map(field => (
                                    <td key={field} className={`cell ${field === 'complete' ? 'center' : ''}`}>
                                        {renderCell(row, field, true)}
                                    </td>
                                ))}
                                <td className="cell center">
                                    {renderActionButtons(row)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                )}
                <tbody>
                    {data.map(row => (
                        <tr 
                            key={row.id} 
                            style={getRowStyle(row)}
                            className={`${editedRows[row.id] ? 'row-edited' : ''}`}
                        >
                            {['market', 'clientSponsor', 'project', 'dueDate', 'task', 
                            'complete', 'team', 'me', 'deployment', 'notes'].map(field => (
                                <td key={field} className={`cell ${field === 'complete' ? 'center' : ''}`}>
                                    {renderCell(row, field)}
                                </td>
                            ))}
                            <td className="cell center">
                                {renderActionButtons(row)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimelineTable;