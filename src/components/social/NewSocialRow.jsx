import React, { useState } from 'react';
import { useSocial } from './SocialProvider';
import { platforms, socialStatuses } from './SocialFields';
import { socialColorConfig } from './SocialColorConfig';
import { PlatformBadge } from './PlatformBadge';
import { Check, X } from 'lucide-react';

const NewSocialRow = ({ onClose, row }) => {
  const { updatePendingCell, commitPendingRow, removePendingRow } = useSocial();
  const [formState, setFormState] = useState({
    details: row.details || '',
    brand: row.brand || '',
    content: row.content || '',
    platforms: row.platforms || '[]',
    postDate: row.postDate || '',
    status: row.status || 'In Progress',
    owner: row.owner || '',
    notes: row.notes || '',
  });

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

  const selectedPlatforms = (() => {
    try {
      const parsed = JSON.parse(formState.platforms);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const togglePlatform = (p) => {
    const newSelected = selectedPlatforms.includes(p)
      ? selectedPlatforms.filter(x => x !== p)
      : [...selectedPlatforms, p];
    handleChange('platforms', JSON.stringify(newSelected));
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="new-timeline-row new-social-row">
      <div className="new-timeline-row-header">
        <h3>New Social Post</h3>
        <div className="new-timeline-actions">
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
              <label className="form-label">Details</label>
              <input
                type="text"
                value={formState.details}
                onChange={(e) => handleChange('details', e.target.value)}
                className="form-input"
                placeholder="What is this post about?"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <select
                value={formState.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="form-input"
              >
                <option value="">Select brand</option>
                {Object.keys(socialColorConfig.brands).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formState.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-input"
              >
                {socialStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <div className="platform-multi-select-form">
                {platforms.map(p => (
                  <label key={p} className={`platform-checkbox ${selectedPlatforms.includes(p) ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(p)}
                      onChange={() => togglePlatform(p)}
                    />
                    <PlatformBadge platform={p} />
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group date-group">
              <label className="form-label">Post Date</label>
              <input
                type="date"
                value={formatDateForInput(formState.postDate)}
                onChange={(e) => handleChange('postDate', e.target.value)}
                className="form-input date-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner</label>
              <input
                type="text"
                value={formState.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label className="form-label">Content</label>
              <textarea
                value={formState.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="form-textarea"
                rows={2}
                placeholder="Post content..."
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

export default NewSocialRow;
