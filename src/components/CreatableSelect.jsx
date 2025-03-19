import React, { useState, useRef, useEffect } from 'react';

const CreatableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option...', 
  field, 
  colorConfig = null 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options || []);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (value) {
      setInputValue(value);
    } else {
      setInputValue('');
    }
  }, [value]);
  
  useEffect(() => {
    if (!options) return;
    
    if (inputValue) {
      const filtered = options.filter(option => 
        option.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        
        if (inputValue && inputValue.trim() !== '' && 
            options && !options.includes(inputValue) && 
            onChange) {
          onChange(inputValue);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputValue, options, onChange]);
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };
  
  const handleOptionClick = (option) => {
    setInputValue(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };
  
  const handleInputFocus = () => {
    setIsOpen(true);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      
      if (inputValue && inputValue.trim() !== '') {
        const exactMatch = options?.find(
          opt => opt.toLowerCase() === inputValue.toLowerCase()
        );
        
        if (exactMatch) {
          setInputValue(exactMatch);
          if (onChange) onChange(exactMatch);
        } else if (onChange) {
          onChange(inputValue);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
      setIsOpen(true);
    }
  };
  
  const getOptionStyle = (option) => {
    if (!colorConfig || !field) return {};
    
    const colorMap = colorConfig[`${field}s`];
    if (!colorMap || !colorMap[option]) return {};
    
    const bgColor = colorMap[option];
    return {
      backgroundColor: bgColor,
      color: colorConfig.getContrastText(bgColor)
    };
  };
  
  const getInputStyle = () => {
    if (!value || !colorConfig || !field) return {};
    
    const colorMap = colorConfig[`${field}s`];
    if (!colorMap || !colorMap[value]) return {};
    
    const bgColor = colorMap[value];
    return {
      backgroundColor: bgColor,
      color: colorConfig.getContrastText(bgColor)
    };
  };
  
  return (
    <div className="creatable-select" ref={containerRef}>
      <div className={`creatable-select-control ${isOpen ? 'is-open' : ''}`} style={getInputStyle()}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="creatable-select-input"
        />
        <div 
          className="creatable-select-indicator" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▲' : '▼'}
        </div>
      </div>
      
      {isOpen && (
        <div className="creatable-select-menu">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className={`creatable-select-option ${value === option ? 'is-selected' : ''}`}
                onClick={() => handleOptionClick(option)}
                style={getOptionStyle(option)}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="creatable-select-no-options">
              {inputValue.trim() !== '' ? (
                <span>Press Enter to add "{inputValue}"</span>
              ) : (
                <span>No options available</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableSelect;