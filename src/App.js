import React from 'react';
import { TimelineProvider } from './components/TimelineProvider';
import { TimelineTable } from './components/TimelineTable';
import { TimelineToolbar } from './components/TimelineToolbar';
import { TimelineModals } from './components/TimelineModals';
import './styles/base.css';
import './styles/table.css';
import './styles/components.css';
import './styles/ui.css';

const TimelineContent = () => {
  const { modals, openDeleteModal } = TimelineModals();

  return (
    <div className="timelines-container">
      <TimelineToolbar />
      <TimelineTable onDeleteClick={openDeleteModal} />
      {modals}
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