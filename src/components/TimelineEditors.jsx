import React, { useRef, useEffect, useMemo } from 'react';
import { markets, clients, projects } from './fields';
import { colorConfig } from './ColorConfig';

export const TextEditor = React.memo(({ value, onChange, autoFocus, style }) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="cell-input"
      style={style}
      autoFocus={autoFocus}
    />
  ));
  
  export const TextAreaEditor = React.memo(({ value, onChange, autoFocus, style }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="cell-textarea"
      style={style}
      autoFocus={autoFocus}
    />
  ));

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
  const [inputValue, setInputValue] = useState(value || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const containerRef = useRef(null);
  
  const getOptions = () => {
    switch (field) {
      case 'market': return markets;
      case 'clientSponsor': return clients;
      case 'project': return projects;
      default: return [];
    }
  };
  
  const options = getOptions();
  
  useEffect(() => {
    if (inputValue) {
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        
        if (inputValue && !options.includes(inputValue)) {
          addNewOption(inputValue);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, options]);
  
  const addNewOption = (newOption) => {
    if (!newOption.trim()) return;
    
    if (field === 'market' && !markets.includes(newOption)) {
      markets.push(newOption);
    } else if (field === 'clientSponsor' && !clients.includes(newOption)) {
      clients.push(newOption);
    } else if (field === 'project' && !projects.includes(newOption)) {
      projects.push(newOption);
    }
    
    onChange(newOption);
  };
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsDropdownOpen(true);
  };
  
  const handleOptionClick = (option) => {
    setInputValue(option);
    onChange(option);
    setIsDropdownOpen(false);
  };
  
  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (inputValue) {
        const exactMatch = options.find(opt => 
          opt.toLowerCase() === inputValue.toLowerCase()
        );
        
        if (exactMatch) {
          setInputValue(exactMatch);
          onChange(exactMatch);
        } else {
          addNewOption(inputValue);
        }
      }
      setIsDropdownOpen(false);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };
  
  const getPlaceholder = () => {
    switch (field) {
      case 'clientSponsor': return 'Type to select or add client...';
      default: return `Type to select or add ${field}...`;
    }
  };
  
  const getTextStyle = () => {
    if (!inputValue) return {};
    
    const existingOption = options.find(opt => opt === inputValue);
    if (existingOption) {
      const colorMap = field === 'market' ? colorConfig.markets :
                      field === 'clientSponsor' ? colorConfig.clients :
                      field === 'project' ? colorConfig.projects : null;
      
      const bgColor = colorMap?.[existingOption];
      if (bgColor) {
        return {
          color: colorConfig.getContrastText(bgColor)
        };
      }
    }
    return {};
  };
  
  return (
    <div className="creatable-select-container" ref={containerRef} style={style}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        className="creatable-select-input"
        style={getTextStyle()}
        autoFocus={autoFocus}
      />
      
      {isDropdownOpen && (
        <div className="creatable-select-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const colorMap = field === 'market' ? colorConfig.markets :
                              field === 'clientSponsor' ? colorConfig.clients :
                              field === 'project' ? colorConfig.projects : null;
              
              const bgColor = colorMap?.[option];
              const optionStyle = bgColor ? {
                backgroundColor: bgColor,
                color: colorConfig.getContrastText(bgColor)
              } : {};
              
              return (
                <div
                  key={option}
                  className="creatable-select-option"
                  style={optionStyle}
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </div>
              );
            })
          ) : (
            <div className="creatable-select-no-options">
              <em>No matches. Press Enter to add "{inputValue}"</em>
            </div>
          )}
        </div>
      )}
    </div>
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