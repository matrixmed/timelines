import React, { useState, useCallback } from 'react';
import { TimelineProvider } from './components/TimelineProvider';
import { TimelineTable } from './components/TimelineTable';
import { TimelineCalendar } from './components/TimelineCalendar';
import { TimelineToolbar } from './components/TimelineToolbar';
import { TimelineModals } from './components/TimelineModals';
import { SocialProvider } from './components/social/SocialProvider';
import { SocialTable } from './components/social/SocialTable';
import { SocialCalendar } from './components/social/SocialCalendar';
import { SocialModals } from './components/social/SocialModals';
import { SocialFilters } from './components/social/SocialFilters';
import './styles/base.css';
import './styles/table.css';
import './styles/components.css';
import './styles/ui.css';
import './styles/calendar.css';
import './styles/rowstyles.css';
import './styles/social.css';

const loadPersistedState = () => {
    try {
        return {
            activeTab: localStorage.getItem('activeTab') || 'editor',
            activeView: localStorage.getItem('activeView') || 'table'
        };
    } catch {
        return { activeTab: 'editor', activeView: 'table' };
    }
};

const TimelineContent = () => {
    const persisted = loadPersistedState();
    const [activeTab, setActiveTab] = useState(persisted.activeTab);
    const [view, setView] = useState(persisted.activeView);
    const { openDeleteModal, DeleteModal } = TimelineModals();
    const { openDeleteModal: openSocialDeleteModal, DeleteModal: SocialDeleteModal } = SocialModals();

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        try { localStorage.setItem('activeTab', tab); } catch {}
    }, []);

    const handleViewChange = useCallback((v) => {
        setView(v);
        try { localStorage.setItem('activeView', v); } catch {}
    }, []);

    const handleDeleteClick = useCallback((row) => {
        openDeleteModal(row);
    }, [openDeleteModal]);

    const handleSocialDeleteClick = useCallback((row) => {
        openSocialDeleteModal(row);
    }, [openSocialDeleteModal]);

    return (
        <div className="timelines-container">
            <div className="header-shield"></div>
            <TimelineToolbar
                currentView={view}
                onViewChange={handleViewChange}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />
            {activeTab === 'editor' ? (
                <>
                    {view === 'table' ? (
                        <TimelineTable onDeleteClick={handleDeleteClick} />
                    ) : (
                        <TimelineCalendar onDeleteClick={handleDeleteClick} />
                    )}
                    <DeleteModal />
                </>
            ) : (
                <>
                    {view === 'table' ? (
                        <>
                            <SocialTable onDeleteClick={handleSocialDeleteClick} />
                            <SocialFilters />
                        </>
                    ) : (
                        <SocialCalendar onDeleteClick={handleSocialDeleteClick} />
                    )}
                    <SocialDeleteModal />
                </>
            )}
        </div>
    );
};

function App() {
    return (
        <TimelineProvider>
            <SocialProvider>
                <TimelineContent />
            </SocialProvider>
        </TimelineProvider>
    );
}

export default App;