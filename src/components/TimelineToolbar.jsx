import React, { useState } from 'react';
import { Plus, Search, Download, Filter as FilterIcon } from 'lucide-react';
import { useTimeline } from './TimelineProvider';
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from './ui/tooltip';

export const TimelineToolbar = () => {
    const {
        searchTerm,
        setSearchTerm,
        addRow,
        data
    } = useTimeline();

    const [showFilters, setShowFilters] = useState(false);

    const handleExport = () => {
        const headers = [
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

        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.market,
                row.clientSponsor,
                row.project,
                row.dueDate,
                `"${row.task?.replace(/"/g, '""') || ''}"`,
                row.complete ? 'TRUE' : 'FALSE',
                row.team,
                row.me,
                row.deployment,
                `"${row.notes?.replace(/"/g, '""') || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `timelines_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="toolbar sticky">
            <div className="toolbar-left">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="toolbar-button" onClick={addRow}>
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
                                <FilterIcon size={18} /> Filters
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Toggle column filters
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
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
                            Export to CSV
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};

export default TimelineToolbar;