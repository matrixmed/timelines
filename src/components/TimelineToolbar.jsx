import React, { useState } from 'react';
import { Plus, Search, Download, Filter as FilterIcon, Calendar, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTimeline } from './TimelineProvider';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "./ui/tooltip";
import { TimelineFilters, applyFilters } from './TimelineFilters';

export const TimelineToolbar = ({ currentView, onViewChange }) => {
    const {
        searchTerm,
        setSearchTerm,
        addRow,
        data,
        filters,
        setFilters
    } = useTimeline();

    const [showFilters, setShowFilters] = useState(false);

    const activeFilterCount = Object.keys(filters).length;

    const handleExport = () => {
        const filteredData = applyFilters(data, filters, searchTerm);

        const headers = [
            'Market',
            'Client/Brand',
            'Project',
            'Due Date',
            'Task',
            'Complete',
            'Team',
            'ME',
            'Deployment',
            'Notes',
            'Missed Deadline'
        ];

        const excelData = [
            headers,
            ...filteredData.map(row => [
                row.market || '',
                row.clientSponsor || '',
                row.project || '',
                row.dueDate || '',
                row.task || '',
                row.complete ? 'TRUE' : 'FALSE',
                row.team || '',
                row.me || '',
                row.deployment || '',
                row.notes || '',
                row.missedDeadline ? 'TRUE' : 'FALSE'
            ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Timelines');

        XLSX.writeFile(workbook, `timelines_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleAddRow = () => {
        addRow();
    };

    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const toggleView = () => {
        onViewChange(currentView === 'table' ? 'calendar' : 'table');
    };

    return (
        <div className="toolbar sticky">
            <div className="toolbar-left">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="toolbar-button" onClick={handleAddRow}>
                                <Plus size={18} /> New Row
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Add a new timeline entry
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`toolbar-button ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FilterIcon size={18} />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="filter-badge">{activeFilterCount}</span>
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Toggle column filters
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="toolbar-button"
                                onClick={toggleView}
                            >
                                {currentView === 'table' ? (
                                    <>
                                        <Calendar size={18} /> Calendar
                                    </>
                                ) : (
                                    <>
                                        <Table size={18} /> Table
                                    </>
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Switch to {currentView === 'table' ? 'Calendar' : 'Table'} view
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {activeFilterCount > 0 && (
                    <button
                        className="toolbar-button clear-filters"
                        onClick={handleClearFilters}
                    >
                        Clear All Filters
                    </button>
                )}
            </div>

            <div className="toolbar-right">
                <div className="search-container">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button
                            className="search-clear-btn"
                            onClick={() => setSearchTerm('')}
                            title="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="toolbar-button"
                                onClick={handleExport}
                            >
                                <Download size={18} /> Export
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Export to Excel
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {showFilters && (
                <div className="toolbar-filters">
                    <TimelineFilters />
                </div>
            )}
        </div>
    );
};

export default TimelineToolbar;
