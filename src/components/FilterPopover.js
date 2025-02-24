import React from 'react';
import { Filter as FilterIcon } from 'lucide-react';

export const FilterPopover = ({ column, value, onChange, type = 'text' }) => {
    const renderFilterContent = () => {
        switch (type) {
            case 'boolean':
                return (
                    <div className="p-2 space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select 
                            className="w-full p-1 text-sm border rounded"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}
                        >
                            <option value="">All</option>
                            <option value="true">Complete</option>
                            <option value="false">Incomplete</option>
                        </select>
                    </div>
                );
            
            case 'date':
                return (
                    <div className="p-2 space-y-2">
                        <div>
                            <label className="text-sm font-medium">From</label>
                            <input
                                type="date"
                                className="w-full p-1 text-sm border rounded mt-1"
                                value={value?.from || ''}
                                onChange={(e) => onChange({ ...value, from: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">To</label>
                            <input
                                type="date"
                                className="w-full p-1 text-sm border rounded mt-1"
                                value={value?.to || ''}
                                onChange={(e) => onChange({ ...value, to: e.target.value })}
                            />
                        </div>
                    </div>
                );
            
            default:
                return (
                    <div className="p-2">
                        <input
                            type="text"
                            className="w-full p-1 text-sm border rounded"
                            placeholder={`Filter ${column}...`}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="filter-popover">
            <button 
                className={`filter-button ${value ? 'active' : ''}`}
                title={`Filter ${column}`}
            >
                <FilterIcon size={14} />
            </button>
            <div className="filter-content">
                {renderFilterContent()}
            </div>
        </div>
    );
};