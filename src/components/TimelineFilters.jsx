import React from 'react';
import { Filter as FilterIcon } from 'lucide-react';
import { useTimeline } from './TimelineProvider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const getColumnType = (column) => {
    switch (column) {
        case 'complete':
            return 'boolean';
        case 'dueDate':
            return 'date';
        default:
            return 'text';
    }
};

const FilterSelect = ({ value, onChange, children }) => (
    <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
            {children}
        </SelectContent>
    </Select>
);

export const TimelineFilters = () => {
    const { filters, setFilters, data } = useTimeline();

    const getUniqueValues = (column) => {
        const values = new Set(data.map(row => row[column]).filter(Boolean));
        return Array.from(values).sort();
    };

    const handleFilterChange = (column, value) => {
        setFilters(prev => ({
            ...prev,
            [column]: value === '' ? null : value
        }));
    };

    const handleDateRangeChange = (column, type, value) => {
        setFilters(prev => ({
            ...prev,
            [column]: {
                ...prev[column],
                [type]: value
            }
        }));
    };

    const renderFilterContent = (column) => {
        const type = getColumnType(column);
        const value = filters[column];

        switch (type) {
            case 'boolean':
                return (
                    <div className="p-2 space-y-2">
                        <FilterSelect
                            value={value?.toString()}
                            onChange={(newValue) => handleFilterChange(
                                column,
                                newValue === '' ? null : newValue === 'true'
                            )}
                        >
                            <SelectItem value="">All</SelectItem>
                            <SelectItem value="true">Complete</SelectItem>
                            <SelectItem value="false">Incomplete</SelectItem>
                        </FilterSelect>
                    </div>
                );

            case 'date':
                return (
                    <div className="p-2 space-y-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">From</label>
                            <input
                                type="date"
                                className="w-full px-2 py-1 text-sm border rounded"
                                value={value?.from || ''}
                                onChange={(e) => handleDateRangeChange(column, 'from', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">To</label>
                            <input
                                type="date"
                                className="w-full px-2 py-1 text-sm border rounded"
                                value={value?.to || ''}
                                onChange={(e) => handleDateRangeChange(column, 'to', e.target.value)}
                            />
                        </div>
                    </div>
                );

            default:
                const uniqueValues = getUniqueValues(column);
                return uniqueValues.length > 0 ? (
                    <div className="p-2">
                        <FilterSelect
                            value={value || ''}
                            onChange={(newValue) => handleFilterChange(column, newValue)}
                        >
                            <SelectItem value="">All</SelectItem>
                            {uniqueValues.map(val => (
                                <SelectItem key={val} value={val}>
                                    {val}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                    </div>
                ) : (
                    <div className="p-2">
                        <input
                            type="text"
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder={`Filter ${column}...`}
                            value={value || ''}
                            onChange={(e) => handleFilterChange(column, e.target.value)}
                        />
                    </div>
                );
        }
    };

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

    return (
        <div className="filters-container">
            {columns.map(header => {
                const column = header.toLowerCase().replace(/\//g, '');
                const hasFilter = filters[column] !== undefined && filters[column] !== null;
                
                return (
                    <Popover key={column}>
                        <PopoverTrigger asChild>
                            <button 
                                className={`filter-button ${hasFilter ? 'active' : ''}`}
                                title={`Filter ${header}`}
                            >
                                <FilterIcon size={14} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52" align="start">
                            <div className="text-sm font-medium pb-2 px-2">
                                Filter {header}
                            </div>
                            {renderFilterContent(column)}
                            {hasFilter && (
                                <div className="pt-2 px-2">
                                    <button
                                        className="text-xs text-red-600 hover:text-red-700"
                                        onClick={() => handleFilterChange(column, null)}
                                    >
                                        Clear filter
                                    </button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                );
            })}
        </div>
    );
};

export const applyFilters = (data, filters, searchTerm) => {
    return data.filter(row => {
        const matchesSearch = !searchTerm || Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesFilters = Object.entries(filters).every(([column, filterValue]) => {
            if (!filterValue) return true;

            const type = getColumnType(column);
            switch (type) {
                case 'boolean':
                    return row[column] === filterValue;

                case 'date': {
                    const rowDate = new Date(row[column]);
                    const fromDate = filterValue.from ? new Date(filterValue.from) : null;
                    const toDate = filterValue.to ? new Date(filterValue.to) : null;

                    if (fromDate && toDate) {
                        return rowDate >= fromDate && rowDate <= toDate;
                    } else if (fromDate) {
                        return rowDate >= fromDate;
                    } else if (toDate) {
                        return rowDate <= toDate;
                    }
                    return true;
                }

                default:
                    return String(row[column])
                        .toLowerCase()
                        .includes(String(filterValue).toLowerCase());
            }
        });

        return matchesSearch && matchesFilters;
    });
};

export default TimelineFilters;