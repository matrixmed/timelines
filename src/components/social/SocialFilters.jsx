import React, { useEffect, useCallback } from 'react';
import { useSocial } from './SocialProvider';

const normalizeColumnName = (column) => {
  const columnMapping = {
    'Details': 'details',
    'Brand': 'brand',
    'Content': 'content',
    'Platform': 'platforms',
    'Post Date': 'postDate',
    'Time': 'postTime',
    'Status': 'status',
    'Updates': 'notes',
    'Notes': 'notes',
    'details': 'details',
    'brand': 'brand',
    'content': 'content',
    'platforms': 'platforms',
    'postDate': 'postDate',
    'postTime': 'postTime',
    'status': 'status',
    'notes': 'notes'
  };
  return columnMapping[column] || column.toLowerCase();
};

const getColumnType = (column) => {
  const normalized = normalizeColumnName(column);
  switch (normalized) {
    case 'postDate':
      return 'date';
    case 'brand':
    case 'status':
    case 'content':
      return 'select';
    case 'platforms':
      return 'multiselect';
    case 'postTime':
      return 'text';
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
    } else if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const parts = dateValue.split('T')[0].split('-').map(Number);
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        const parts = parsed.toISOString().split('T')[0].split('-');
        date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      } else {
        return null;
      }
    }
    if (isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  } catch {
    return null;
  }
}

export const SocialFilters = () => {
  const { filters, setFilters, data } = useSocial();

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

    if (columnType === 'date') {
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
          [normalizedColumn]: { from: fromInput.value || null, to: toInput.value || null }
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
        setFilters(prev => ({
          ...prev,
          [normalizedColumn]: e.target.value || null
        }));
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(select);
    } else if (columnType === 'multiselect') {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'simple-filter-input';
      input.placeholder = 'Filter platforms...';
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
        if (e.key === 'Enter') applyBtn.click();
      });

      btnGroup.appendChild(applyBtn);
      dropdown.appendChild(input);
      dropdown.appendChild(btnGroup);
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
        if (e.key === 'Enter') applyBtn.click();
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
          const newFilters = { ...prev };
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
        if (el !== dropdown) el.style.display = 'none';
      });
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';

      if (!isVisible) {
        setTimeout(() => {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          dropdown.style.top = '100%';
          dropdown.style.bottom = 'auto';

          const buttonRect = filterButton.getBoundingClientRect();
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

    filterContainer.appendChild(filterButton);
    filterContainer.appendChild(dropdown);
    filterSlot.appendChild(filterContainer);
  }, [filters, data, setFilters]);

  const attachFilterButtons = useCallback(() => {
    const columns = ['Details', 'Content', 'Brand', 'Platform', 'Post Date', 'Time', 'Status', 'Updates'];

    columns.forEach(column => {
      const filterSlot = document.querySelector(`.header-filter-icon[data-column="${column}"][data-table="social"]`);
      if (filterSlot) {
        createFilterButtonForColumn(column, filterSlot);
      }
    });
  }, [filters, data, setFilters, createFilterButtonForColumn]);

  useEffect(() => {
    attachFilterButtons();
  }, [attachFilterButtons]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      const relevantMutation = mutations.some(mutation => {
        return Array.from(mutation.removedNodes).some(node => {
          return node.classList &&
            (node.classList.contains('simple-filter-button') ||
              (node.querySelector && node.querySelector('.simple-filter-button')));
        });
      });
      if (relevantMutation) {
        setTimeout(attachFilterButtons, 50);
      }
    });

    const tableHeader = document.querySelector('.social-table thead');
    if (tableHeader) {
      observer.observe(tableHeader, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    return () => observer.disconnect();
  }, [filters, attachFilterButtons]);

  return null;
};

export const applySocialFilters = (data, filters, searchTerm) => {
  if (Object.keys(filters).length === 0 && !searchTerm) {
    return data;
  }

  return data.filter(row => {
    const matchesSearch = !searchTerm ||
      Object.entries(row).some(([key, value]) => {
        if (value === null || value === undefined || typeof value === 'object') return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });

    if (!matchesSearch) return false;

    return Object.entries(filters).every(([column, filterValue]) => {
      if (filterValue === null || filterValue === undefined) return true;

      const type = getColumnType(column);
      const value = row[column];

      switch (type) {
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

            if (fromDate && toDate) return rowDate >= fromDate && rowDate <= toDate;
            if (fromDate) return rowDate >= fromDate;
            if (toDate) return rowDate <= toDate;
            return true;
          } catch {
            return false;
          }
        }
        case 'select':
          return value && String(value) === String(filterValue);
        case 'multiselect':
          return value && String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'text':
        default:
          return value && String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      }
    });
  });
};

export default SocialFilters;