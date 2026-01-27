import React, { useEffect, useCallback } from 'react';
import { useTimeline } from './TimelineProvider';

const normalizeColumnName = (column) => {
    const columnMapping = {
        'Market': 'market',
        'Client/Brand': 'clientSponsor',
        'Project': 'project',
        'Due Date': 'dueDate',
        'Task': 'task',
        'Complete': 'complete',
        'Team': 'team',
        'ME': 'me',
        'Deployment': 'deployment',
        'Notes': 'notes',
        'market': 'market',
        'clientSponsor': 'clientSponsor',
        'project': 'project',
        'dueDate': 'dueDate',
        'task': 'task',
        'complete': 'complete',
        'team': 'team',
        'me': 'me',
        'deployment': 'deployment',
        'notes': 'notes'
    };

    return columnMapping[column] || column.toLowerCase().replace(/\//g, '');
};

const getColumnType = (column) => {
    const normalizedColumn = normalizeColumnName(column);
    
    switch (normalizedColumn) {
        case 'complete':
            return 'boolean';
        case 'dueDate':
            return 'date';
        case 'market':
        case 'clientSponsor':
        case 'project':
            return 'select';
        default:
            return 'text';
    }
};

function parseAndNormalizeDate(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
    }

    try {
      let date;

      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        date = new Date(year, month - 1, day);
      }
      else if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const parts = dateValue.split('T')[0].split('-').map(Number);
        date = new Date(parts[0], parts[1] - 1, parts[2]);
      }
      else if (typeof dateValue === 'string' && dateValue.includes(',')) {
        const parts = dateValue.split(',');
        if (parts.length >= 2) {
          const dateStr = parts.slice(1).join(',').trim();
          date = new Date(dateStr);
        } else {
          date = new Date(dateValue);
        }
      }
      else {
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          const parts = parsed.toISOString().split('T')[0].split('-');
          date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        } else {
          date = parsed;
        }
      }

      if (isNaN(date.getTime())) {
        return null;
      }

      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } catch (e) {
      console.error("Error parsing date:", e);
      return null;
    }
}

export const TimelineFilters = () => {
    const { filters, setFilters, data } = useTimeline();
    
    useEffect(() => {
        const addFilterStyles = () => {
            let styleEl = document.getElementById('filter-button-styles');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'filter-button-styles';
                document.head.appendChild(styleEl);
            }
            
            
        };
        
        addFilterStyles();
    }, []);
    
    const createFilterButtonForColumn = useCallback((column, filterSlot) => {
        if (!filterSlot) return;
        
        filterSlot.innerHTML = '';
        
        const normalizedColumn = normalizeColumnName(column);
        const hasActiveFilter = filters[normalizedColumn] !== undefined && 
                              filters[normalizedColumn] !== null;
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'simple-filter-container';
        
        const filterButton = document.createElement('button');
        filterButton.className = `simple-filter-button ${hasActiveFilter ? 'active' : ''}`;
        filterButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
        `;
        
        if (hasActiveFilter) {
            const indicator = document.createElement('span');
            indicator.className = 'filter-active-indicator';
            filterButton.appendChild(indicator);
        }
        
        const dropdown = document.createElement('div');
        dropdown.className = 'simple-filter-dropdown';
        
        const columnType = getColumnType(column);
        
        if (columnType === 'boolean') {
            const select = document.createElement('select');
            select.className = 'simple-filter-select';
            
            const options = [
                { value: '', text: 'All' },
                { value: 'true', text: 'Complete' },
                { value: 'false', text: 'Incomplete' }
            ];
            
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                
                const currentValue = filters[normalizedColumn];
                option.selected = currentValue === (opt.value === 'true' ? true : 
                                   opt.value === 'false' ? false : null);
                
                select.appendChild(option);
            });
            
            select.addEventListener('change', (e) => {
                const value = e.target.value;
                setFilters(prev => ({
                    ...prev,
                    [normalizedColumn]: value === '' ? null : value === 'true'
                }));
                
                dropdown.style.display = 'none';
            });
            
            dropdown.appendChild(select);
        } else if (columnType === 'date') {
            const dateContainer = document.createElement('div');
            dateContainer.className = 'filter-date-range';
            
            const fromGroup = document.createElement('div');
            const fromLabel = document.createElement('label');
            fromLabel.textContent = 'From';
            const fromInput = document.createElement('input');
            fromInput.type = 'date';
            fromInput.className = 'simple-filter-input';
            fromInput.value = filters[normalizedColumn]?.from || '';
            
            fromGroup.appendChild(fromLabel);
            fromGroup.appendChild(fromInput);
            
            const toGroup = document.createElement('div');
            const toLabel = document.createElement('label');
            toLabel.textContent = 'To';
            const toInput = document.createElement('input');
            toInput.type = 'date';
            toInput.className = 'simple-filter-input';
            toInput.value = filters[normalizedColumn]?.to || '';
            
            toGroup.appendChild(toLabel);
            toGroup.appendChild(toInput);
            
            dateContainer.appendChild(fromGroup);
            dateContainer.appendChild(toGroup);
            
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.marginTop = '8px';
            
            const applyBtn = document.createElement('button');
            applyBtn.className = 'simple-filter-apply-btn';
            applyBtn.textContent = 'Apply';
            
            applyBtn.addEventListener('click', () => {
                setFilters(prev => ({
                    ...prev,
                    [normalizedColumn]: {
                        from: fromInput.value || null,
                        to: toInput.value || null
                    }
                }));
                
                dropdown.style.display = 'none';
            });
            
            btnGroup.appendChild(applyBtn);
            
            dropdown.appendChild(dateContainer);
            dropdown.appendChild(btnGroup);
            
        } else if (columnType === 'select') {
            const columnValues = [...new Set(
                data.map(row => row[normalizedColumn]).filter(Boolean)
            )].sort();
            
            const select = document.createElement('select');
            select.className = 'simple-filter-select';
            
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'All';
            select.appendChild(allOption);
            
            columnValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                option.selected = filters[normalizedColumn] === value;
                select.appendChild(option);
            });
            
            select.addEventListener('change', (e) => {
                const value = e.target.value;
                setFilters(prev => ({
                    ...prev,
                    [normalizedColumn]: value || null
                }));
                
                dropdown.style.display = 'none';
            });
            
            dropdown.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'simple-filter-input';
            input.placeholder = `Filter ${column}...`;
            input.value = filters[normalizedColumn] || '';
            
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.marginTop = '8px';
            
            const applyBtn = document.createElement('button');
            applyBtn.className = 'simple-filter-apply-btn';
            applyBtn.textContent = 'Apply';
            
            applyBtn.addEventListener('click', () => {
                setFilters(prev => ({
                    ...prev,
                    [normalizedColumn]: input.value || null
                }));
                
                dropdown.style.display = 'none';
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    applyBtn.click();
                }
            });
            
            btnGroup.appendChild(applyBtn);
            
            dropdown.appendChild(input);
            dropdown.appendChild(btnGroup);
        }
        
        if (hasActiveFilter) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'simple-filter-clear-btn';
            clearBtn.textContent = 'Clear';
            clearBtn.addEventListener('click', () => {
                setFilters(prev => {
                    const newFilters = {...prev};
                    delete newFilters[normalizedColumn];
                    return newFilters;
                });
                
                dropdown.style.display = 'none';
            });
            
            const btnGroup = dropdown.querySelector('div[style*="display: flex"]') || document.createElement('div');
            if (!btnGroup.parentNode) {
                btnGroup.style.display = 'flex';
                btnGroup.style.marginTop = '8px';
                dropdown.appendChild(btnGroup);
            }
            
            btnGroup.appendChild(clearBtn);
        }
        
        filterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            document.querySelectorAll('.simple-filter-dropdown').forEach(el => {
                if (el !== dropdown) {
                    el.style.display = 'none';
                }
            });
            
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                setTimeout(() => {
                    const buttonRect = filterButton.getBoundingClientRect();
                    const headerRect = filterSlot.closest('th').getBoundingClientRect();
                    
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    dropdown.style.top = '100%';
                    dropdown.style.bottom = 'auto';
                    
                    if (buttonRect.right + 150 > viewportWidth) {
                        dropdown.style.right = '0';
                        dropdown.style.left = 'auto';
                    } else {
                        dropdown.style.left = '0';
                        dropdown.style.right = 'auto';
                    }
                    
                    const dropdownRect = dropdown.getBoundingClientRect();
                    if (dropdownRect.bottom > viewportHeight - 20) {
                        dropdown.style.top = 'auto';
                        dropdown.style.bottom = '100%';
                    }
                }, 10);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== filterButton) {
                dropdown.style.display = 'none';
            }
        });
        
        filterButton.dataset.initialized = 'true';
        
        filterContainer.appendChild(filterButton);
        filterContainer.appendChild(dropdown);
        filterSlot.appendChild(filterContainer);
    }, [filters, data, setFilters]);
    
    const attachFilterButtons = useCallback(() => {
        const columns = [
            'Market',
            'Client/Brand',
            'Project',
            'Due Date',
            'Task',
            'Complete',
            'Team',
            'ME',
            'Deployment',
            'Notes'
        ];
        
        columns.forEach(column => {
            const filterSlot = document.querySelector(`.header-filter-icon[data-column="${column}"]`);
            if (filterSlot) {
                createFilterButtonForColumn(column, filterSlot);
            }
        });
        
        console.log('Filter buttons attached, active filters:', Object.keys(filters));
        
        setTimeout(() => {
            const allFilters = document.querySelectorAll('.header-filter-icon');
            allFilters.forEach(filterSlot => {
                const column = filterSlot.getAttribute('data-column');
                if (column) {
                    const normalizedColumn = normalizeColumnName(column);
                    const hasActiveFilter = filters[normalizedColumn] !== undefined && 
                                          filters[normalizedColumn] !== null;
                    
                    if (!filterSlot.querySelector('.simple-filter-button')) {
                        console.log(`Attaching missing filter button for ${column}`);
                        createFilterButtonForColumn(column, filterSlot);
                    }
                }
            });
        }, 200);
    }, [filters, data, setFilters, createFilterButtonForColumn]);
    
    useEffect(() => {
        attachFilterButtons();
        
        window.addEventListener('load', attachFilterButtons);
        
        return () => {
            window.removeEventListener('load', attachFilterButtons);
        };
    }, [attachFilterButtons]);
    
    useEffect(() => {
        const recreateFilterButtonsIfNeeded = () => {
            const hasActiveFilters = Object.keys(filters).length > 0;
            
            const headerFilters = document.querySelectorAll('.header-filter-icon');
            const buttonCount = document.querySelectorAll('.simple-filter-button').length;
            
            if (headerFilters.length > 0 && buttonCount < headerFilters.length) {
                console.log('Some filter buttons missing, recreating them...');
                attachFilterButtons();
            }
        };
        
        recreateFilterButtonsIfNeeded();
        setTimeout(recreateFilterButtonsIfNeeded, 300);
        
        const observer = new MutationObserver((mutations) => {
            const relevantMutation = mutations.some(mutation => {
                return Array.from(mutation.removedNodes).some(node => {
                    return node.classList && 
                          (node.classList.contains('simple-filter-button') || 
                           node.querySelector && node.querySelector('.simple-filter-button'));
                });
            });
            
            if (relevantMutation) {
                console.log('Filter buttons removed via DOM mutation, recreating...');
                setTimeout(attachFilterButtons, 50);
            }
        });
        
        const tableHeader = document.querySelector('.timelines-table thead');
        if (tableHeader) {
            observer.observe(tableHeader, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }
        
        return () => {
            observer.disconnect();
        };
    }, [filters, attachFilterButtons]);

    return null; 
};

export const applyFilters = (data, filters, searchTerm) => {
    if (Object.keys(filters).length === 0 && !searchTerm) {
        return data;
    }

    return data.filter(row => {
        const matchesSearch = !searchTerm || 
            Object.entries(row).some(([key, value]) => {
                if (value === null || value === undefined || typeof value === 'object') {
                    return false;
                }
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });

        if (!matchesSearch) {
            return false;
        }

        return Object.entries(filters).every(([column, filterValue]) => {
            if (filterValue === null || filterValue === undefined) {
                return true;
            }

            const type = getColumnType(column);
            const value = row[column];

            switch (type) {
                case 'boolean':
                    if (column === 'complete') {
                        const rowValue = typeof value === 'boolean' ? value : Boolean(value);
                        const filterVal = typeof filterValue === 'boolean' ? filterValue : 
                                        filterValue === 'true' ? true : false;
                        
                        return rowValue === filterVal;
                    }
                    return value === filterValue;

                case 'date': {
                    if (!value) return false;
                        
                    try {
                        const rowDate = parseAndNormalizeDate(value);
                        if (!rowDate) return false;
                          
                        let fromDate = null;
                        if (filterValue.from && filterValue.from.trim() !== '') {
                          fromDate = parseAndNormalizeDate(filterValue.from);
                        }
                          
                        let toDate = null;
                        if (filterValue.to && filterValue.to.trim() !== '') {
                          toDate = parseAndNormalizeDate(filterValue.to);
                        }
                          
                        if (fromDate && toDate) {
                          return rowDate >= fromDate && rowDate <= toDate;
                        } else if (fromDate) {
                          return rowDate >= fromDate;
                        } else if (toDate) {
                         return rowDate <= toDate;
                        }
                        return true;
                    } catch (error) {
                        console.error('Error filtering date:', error, value);
                        return false;
                    }
                }

                case 'select':
                    return value && String(value) === String(filterValue);

                case 'text':
                default:
                    return value && String(value)
                        .toLowerCase()
                        .includes(String(filterValue).toLowerCase());
            }
        });
    });
};

export default TimelineFilters;