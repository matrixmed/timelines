import React, { useState, useRef } from 'react';
import { useTimeline } from './TimelineProvider';
import CreatableSelect from './CreatableSelect';
import { markets, clients, projects } from './fields';
import { colorConfig } from './ColorConfig';
import { Check, X, Copy } from 'lucide-react';

const NewTimelineRow = ({ onClose, row }) => {
  const { updatePendingCell, commitPendingRow, removePendingRow, addRowWithData } = useTimeline();
  const [formState, setFormState] = useState({
    market: row.market || '',
    clientSponsor: row.clientSponsor || '',
    project: row.project || '',
    dueDate: row.dueDate || '',
    task: row.task || '',
    complete: row.complete || false,
    team: row.team || '',
    me: row.me || '',
    bd: row.bd || '',
    deployment: row.deployment || '',
    notes: row.notes || '',
  });
  
  const taskInputRef = useRef(null);
  
  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    updatePendingCell(row.id, field, value);
  };
  
  const handleSubmit = () => {
    commitPendingRow(row.id);
  };
  
  const handleCancel = () => {
    removePendingRow(row.id);
    if (onClose) onClose();
  };
  
  const handleDuplicate = () => {
    addRowWithData({ ...formState });
  };
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };
  
  return (
    <div className="new-timeline-row">
      <div className="new-timeline-row-header">
        <h3>New Timeline Entry</h3>
        <div className="new-timeline-actions">
          <button className="new-timeline-button duplicate" onClick={handleDuplicate} title="Duplicate">
            <Copy size={18} />
            <span>Duplicate</span>
          </button>
          <button className="new-timeline-button save" onClick={handleSubmit} title="Save">
            <Check size={18} />
            <span>Save</span>
          </button>
          <button className="new-timeline-button cancel" onClick={handleCancel} title="Cancel">
            <X size={18} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
      <div className="new-timeline-row-content">
        <div className="new-timeline-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Market</label>
              <CreatableSelect
                id="market-input"
                options={markets}
                value={formState.market}
                onChange={(value) => handleChange('market', value)}
                placeholder="Select or create market"
                field="market"
                colorConfig={colorConfig}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client/Sponsor</label>
              <CreatableSelect
                options={clients}
                value={formState.clientSponsor}
                onChange={(value) => handleChange('clientSponsor', value)}
                placeholder="Select or create client"
                field="clientSponsor"
                colorConfig={colorConfig}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Project</label>
              <CreatableSelect
                id="project-input"
                options={projects}
                value={formState.project}
                onChange={(value) => handleChange('project', value)}
                placeholder="Select or create project"
                field="project"
                colorConfig={colorConfig}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group date-group">
              <label className="form-label">Due Date</label>
              <input
                id="dueDate-input"
                type="date"
                value={formatDateForInput(formState.dueDate)}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="form-input date-input"
              />
            </div>
            <div className="form-group complete-group">
              <label className="form-label">Complete</label>
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={formState.complete}
                  onChange={(e) => handleChange('complete', e.target.checked)}
                  className="form-checkbox"
                />
              </div>
            </div>
            <div className="form-group task-group">
              <label className="form-label">Task</label>
              <textarea
                ref={taskInputRef}
                value={formState.task}
                onChange={(e) => handleChange('task', e.target.value)}
                className="form-textarea"
                rows={1}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Team</label>
              <input
                type="text"
                value={formState.team}
                onChange={(e) => handleChange('team', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ME</label>
              <input
                type="text"
                value={formState.me}
                onChange={(e) => handleChange('me', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">BD</label>
              <input
                type="text"
                value={formState.bd}
                onChange={(e) => handleChange('bd', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deployment</label>
              <input
                type="text"
                value={formState.deployment}
                onChange={(e) => handleChange('deployment', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label className="form-label">Notes</label>
              <textarea
                value={formState.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="form-textarea"
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTimelineRow;