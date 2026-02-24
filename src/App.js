import React, { useState, useCallback } from 'react';
import { TimelineProvider } from './components/TimelineProvider';
import { TimelineTable } from './components/TimelineTable';
import { TimelineCalendar } from './components/TimelineCalendar';
import { TimelineToolbar } from './components/TimelineToolbar';
import { TimelineModals } from './components/TimelineModals';
import './styles/base.css';
import './styles/table.css';
import './styles/components.css';
import './styles/ui.css';
import './styles/calendar.css';
import './styles/rowstyles.css';

const TimelineContent = () => {
    const [view, setView] = useState('table');
    const { openDeleteModal, DeleteModal } = TimelineModals();

    const handleDeleteClick = useCallback((row) => {
        console.log("Delete clicked for row:", row.id);
        openDeleteModal(row);
    }, [openDeleteModal]);

    return (
        <div className="timelines-container">
            <div className="header-shield"></div>
            <TimelineToolbar currentView={view} onViewChange={setView} />
            {view === 'table' ? (
                <TimelineTable onDeleteClick={handleDeleteClick} />
            ) : (
                <TimelineCalendar onDeleteClick={handleDeleteClick} />
            )}
            <DeleteModal />
        </div>
    );
};

function App() {
    return (
        <TimelineProvider>
            <TimelineContent />
        </TimelineProvider>
    );
}

export default App;
