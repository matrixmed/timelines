import React, { useState } from 'react';
import { Plus, Search, Download, Filter as FilterIcon, Calendar, Table, Smartphone, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTimeline } from './TimelineProvider';
import { useSocial } from './social/SocialProvider';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "./ui/tooltip";
import { TimelineFilters, applyFilters } from './TimelineFilters';
import { applySocialFilters } from './social/SocialFilters';

export const TimelineToolbar = ({ currentView, onViewChange, activeTab, onTabChange }) => {
    const timeline = useTimeline();
    const social = useSocial();

    const isEditor = activeTab === 'editor';
    const searchTerm = isEditor ? timeline.searchTerm : social.searchTerm;
    const setSearchTerm = isEditor ? timeline.setSearchTerm : social.setSearchTerm;
    const addRow = isEditor ? timeline.addRow : social.addRow;
    const data = isEditor ? timeline.data : social.data;
    const filters = isEditor ? timeline.filters : social.filters;
    const setFilters = isEditor ? timeline.setFilters : social.setFilters;

    const [showFilters, setShowFilters] = useState(false);

    const activeFilterCount = Object.keys(filters).length;

    const handleExport = () => {
        if (isEditor) {
            const filteredData = applyFilters(data, filters, searchTerm);
            const headers = [
                'Market', 'Client/Brand', 'Project', 'Due Date', 'Task',
                'Complete', 'Team', 'ME', 'Deployment', 'Notes', 'Missed Deadline'
            ];
            const excelData = [
                headers,
                ...filteredData.map(row => [
                    row.market || '', row.clientSponsor || '', row.project || '',
                    row.dueDate || '', row.task || '', row.complete ? 'TRUE' : 'FALSE',
                    row.team || '', row.me || '', row.deployment || '',
                    row.notes || '', row.missedDeadline ? 'TRUE' : 'FALSE'
                ])
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Timelines');
            XLSX.writeFile(workbook, `timelines_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        } else {
            const filteredData = applySocialFilters(data, filters, searchTerm);
            const headers = [
                'Details', 'Content', 'Brand', 'Platforms', 'Post Date',
                'Status', 'Notes'
            ];
            const excelData = [
                headers,
                ...filteredData.map(row => {
                    let platformStr = '';
                    try {
                        const parsed = JSON.parse(row.platforms || '[]');
                        platformStr = Array.isArray(parsed) ? parsed.join(', ') : '';
                    } catch { platformStr = row.platforms || ''; }
                    return [
                        row.details || '', row.content || '', row.brand || '',
                        platformStr, row.postDate || '', row.status || '',
                        row.notes || ''
                    ];
                })
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Social Posts');
            XLSX.writeFile(workbook, `social_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
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

    const toggleTab = () => {
        onTabChange(activeTab === 'editor' ? 'social' : 'editor');
        setShowFilters(false);
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
                            Add a new {isEditor ? 'timeline' : 'social'} entry
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

                {/* Social tab toggle - hidden until testing complete
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="toolbar-button tab-toggle-button"
                                onClick={toggleTab}
                            >
                                {activeTab === 'editor' ? <Smartphone size={18} /> : <FileText size={18} />}
                                {activeTab === 'editor' ? 'Social' : 'Editor'}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Switch to {activeTab === 'editor' ? 'Social' : 'Editor'} tab
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                */}

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

            {showFilters && isEditor && (
                <div className="toolbar-filters">
                    <TimelineFilters />
                </div>
            )}
        </div>
    );
};

export default TimelineToolbar;