import React, { useRef, useEffect } from 'react';
import { markets, clients, projects } from './fields';
import { colorConfig } from './ColorConfig';

export const TextEditor = ({ value, onChange, autoFocus, style }) => (
    <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="cell-input"
        style={style}
        autoFocus={autoFocus}
    />
);

export const TextAreaEditor = ({ value, onChange, autoFocus, style }) => (
    <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="cell-textarea"
        style={style}
        autoFocus={autoFocus}
    />
);

export const DateEditor = ({ value, onChange, autoFocus }) => {
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        try {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return '';
        }
    };

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        if (!selectedDate) {
            onChange('');
            return;
        }
        
        try {
            onChange(selectedDate);
            
            console.log('Date selected:', selectedDate);
            const testDate = new Date(selectedDate);
            console.log('Converted to Date object:', testDate);
            console.log('Day of month:', testDate.getDate());
        } catch (error) {
            console.error('Error handling date change:', error);
        }
    };

    return (
        <div className="date-picker-container">
            <input
                type="date"
                value={formatDateForInput(value)}
                onChange={handleDateChange}
                className="cell-date-input"
                autoFocus={autoFocus}
            />
        </div>
    );
};

export const SelectEditor = ({ field, value, onChange, autoFocus, style }) => {
    const getOptions = () => {
        switch (field) {
            case 'market': return markets;
            case 'clientSponsor': return clients;
            case 'project': return projects;
            default: return [];
        }
    };

    const options = getOptions();
    const bgColor = value ? colorConfig[`${field}s`]?.[value] : null;
    const textColor = bgColor ? colorConfig.getContrastText(bgColor) : 'inherit';

    const selectStyle = {
        ...style,
        backgroundColor: bgColor || 'white',
        color: textColor
    };

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="cell-select"
            style={selectStyle}
            autoFocus={autoFocus}
        >
            <option value="">Select {field}</option>
            {options.map(option => (
                <option 
                    key={option} 
                    value={option}
                    style={{
                        backgroundColor: colorConfig[`${field}s`]?.[option] || 'white',
                        color: colorConfig[`${field}s`]?.[option] 
                            ? colorConfig.getContrastText(colorConfig[`${field}s`][option])
                            : 'inherit'
                    }}
                >
                    {option}
                </option>
            ))}
        </select>
    );
};

export const CheckboxEditor = ({ value, onChange }) => (
    <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        className="cell-checkbox"
    />
);

export const EditorWrapper = ({ 
    children, 
    onOutsideClick, 
    style 
}) => {
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                onOutsideClick();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onOutsideClick]);

    return (
        <div 
            ref={wrapperRef}
            className="editor-wrapper"
            style={style}
        >
            {children}
        </div>
    );
};

export const CellDisplay = ({ 
    field, 
    value, 
    onClick, 
    style, 
    isMultiline = false 
}) => {
    const formattedValue = field === 'dueDate' && value
        ? new Date(value).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : value;

    return (
        <div
            className={`cell-content ${isMultiline ? 'cell-content-multiline' : ''}`}
            style={style}
            onClick={onClick}
        >
            {formattedValue}
        </div>
    );
};

export const getEditor = (field) => {
    switch (field) {
        case 'market':
        case 'clientSponsor':
        case 'project':
            return SelectEditor;
        case 'dueDate':
            return DateEditor;
        case 'complete':
            return CheckboxEditor;
        case 'task':
        case 'notes':
            return TextAreaEditor;
        default:
            return TextEditor;
    }
};

export const getDisplayStyle = (field, value, row) => {
    const baseStyle = {
        transition: 'all 0.2s ease',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
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
            return {
                ...baseStyle,
                backgroundColor: bgColor,
                color: colorConfig.getContrastText(bgColor)
            };
        }
    }

    return baseStyle;
};