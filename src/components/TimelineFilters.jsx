import React, { useEffect } from 'react';
import { useTimeline } from './TimelineProvider';

const normalizeColumnName = (column) => {
    const columnMapping = {
        'Market': 'market',
        'Client/Sponsor': 'clientSponsor',
        'Project': 'project',
        'Due Date': 'dueDate',
        'Task': 'task',
        'Complete': 'complete',
        'Team': 'team',
        'ME': 'me',
        'Deployment': 'deployment',
        'Notes': 'notes'
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

export const TimelineFilters = () => {
    const { filters, setFilters, data } = useTimeline();
    
    useEffect(() => {
        const attachFilterButtons = () => {
            const columns = [
                'Market',
                'Client/Sponsor',
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
                    filterSlot.innerHTML = '';
                    
                    const normalizedColumn = normalizeColumnName(column);
                    const hasActiveFilter = filters[normalizedColumn] !== undefined && 
                                          filters[normalizedColumn] !== null;
                    
                    const filterContainer = document.createElement('div');
                    filterContainer.className = 'simple-filter-container';
                    
                    const filterButton = document.createElement('button');
                    filterButton.className = `simple-filter-button ${hasActiveFilter ? 'active' : ''}`;
                    filterButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`;
                    
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
                            const rect = dropdown.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            const viewportWidth = window.innerWidth;
                            
                            if (rect.bottom > viewportHeight) {
                                dropdown.style.bottom = '100%';
                                dropdown.style.top = 'auto';
                            }
                            
                            if (rect.right > viewportWidth) {
                                dropdown.style.right = '0';
                                dropdown.style.left = 'auto';
                            }
                        }
                    });
                    
                    document.addEventListener('click', (e) => {
                        if (!dropdown.contains(e.target) && e.target !== filterButton) {
                            dropdown.style.display = 'none';
                        }
                    });
                    
                    filterContainer.appendChild(filterButton);
                    filterContainer.appendChild(dropdown);
                    filterSlot.appendChild(filterContainer);
                }
            });
        };
        
        setTimeout(attachFilterButtons, 100);
        
    }, [filters, setFilters, data]);

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
                        let rowDate;
                        
                        if (typeof value === 'string') {
                            if (value.includes(',')) {
                                const dateParts = value.split(',');
                                if (dateParts.length >= 2) {
                                    const monthDayYear = dateParts[1].trim() + (dateParts.length > 2 ? dateParts[2] : '');
                                    rowDate = new Date(monthDayYear);
                                } else {
                                    rowDate = new Date(value);
                                }
                            }
                            else if (value.includes('T')) {
                                rowDate = new Date(value.split('T')[0] + 'T00:00:00');
                            }
                            else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                const [y, m, d] = value.split('-').map(Number);
                                rowDate = new Date(y, m - 1, d);
                            }
                            else {
                                rowDate = new Date(value);
                            }
                        } else if (value instanceof Date) {
                            rowDate = new Date(value);
                        } else {
                            return false;
                        }
                        
                        if (isNaN(rowDate.getTime())) {
                            console.warn('Invalid row date:', value);
                            return false;
                        }
                        
                        rowDate.setHours(0, 0, 0, 0);
                        
                        let fromDate = null;
                        if (filterValue.from && filterValue.from.trim() !== '') {
                            if (filterValue.from.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                const [y, m, d] = filterValue.from.split('-').map(Number);
                                fromDate = new Date(y, m - 1, d);
                            } else {
                                fromDate = new Date(filterValue.from);
                            }
                            
                            if (!isNaN(fromDate.getTime())) {
                                fromDate.setHours(0, 0, 0, 0);
                            } else {
                                console.warn('Invalid from date:', filterValue.from);
                                fromDate = null;
                            }
                        }
                        
                        let toDate = null;
                        if (filterValue.to && filterValue.to.trim() !== '') {
                            if (filterValue.to.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                const [y, m, d] = filterValue.to.split('-').map(Number);
                                toDate = new Date(y, m - 1, d);
                            } else {
                                toDate = new Date(filterValue.to);
                            }
                            
                            if (!isNaN(toDate.getTime())) {
                                toDate.setHours(23, 59, 59, 999);
                            } else {
                                console.warn('Invalid to date:', filterValue.to);
                                toDate = null;
                            }
                        }
                        
                        console.log({
                            rowValue: value,
                            rowDate: rowDate.toISOString(),
                            rowDateObj: {
                                year: rowDate.getFullYear(),
                                month: rowDate.getMonth() + 1,
                                day: rowDate.getDate()
                            },
                            filterFrom: filterValue.from,
                            filterFromDate: fromDate ? fromDate.toISOString() : null,
                            filterTo: filterValue.to,
                            filterToDate: toDate ? toDate.toISOString() : null
                        });
                        
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