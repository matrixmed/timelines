import React, { useState } from 'react';
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

const TimelineContent = () => {
    const [view, setView] = useState('table');
    const { openDeleteModal, DeleteModal } = TimelineModals();
    
    return (
        <div className="timelines-container">
            <TimelineToolbar currentView={view} onViewChange={setView} />
            {view === 'table' ? (
                <TimelineTable onDeleteClick={openDeleteModal} />
            ) : (
                <TimelineCalendar onDeleteClick={openDeleteModal} />
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