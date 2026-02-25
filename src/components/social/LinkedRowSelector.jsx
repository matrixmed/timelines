import React, { useState, useEffect, useRef } from 'react';
import config from '../../config';

const isDateInFuture = (dateStr) => {
  if (!dateStr) return false;
  try {
    const parts = dateStr.split('T')[0].split('-').map(Number);
    const rowDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rowDate >= today;
  } catch {
    return false;
  }
};

export const LinkedRowSelector = ({ currentPostDate, linkedTimelineId, onSelect, onClose, filterMarket, inline }) => {
  const [timelineRows, setTimelineRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/timelines`);
        if (response.ok) {
          const data = await response.json();
          setTimelineRows(data);
        }
      } catch (err) {
        console.error('Error fetching timelines for linking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimelines();
  }, []);

  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, inline]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
      const parts = dateStr.split('T')[0].split('-');
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    } catch {
      return dateStr;
    }
  };

  const filteredRows = (() => {
    let rows = timelineRows;

    rows = rows.filter(row =>
      row.id === linkedTimelineId ||
      (row.deployment && row.deployment.toLowerCase().includes('x'))
    );

    if (!search) {
      rows = rows.filter(row => isDateInFuture(row.dueDate) || row.id === linkedTimelineId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      rows = rows.filter(row =>
        (row.market || '').toLowerCase().includes(searchLower) ||
        (row.clientSponsor || '').toLowerCase().includes(searchLower) ||
        (row.project || '').toLowerCase().includes(searchLower) ||
        (row.task || '').toLowerCase().includes(searchLower)
      );
    }

    if (filterMarket) {
      const marketMatch = rows.filter(r => (r.market || '').toLowerCase() === filterMarket.toLowerCase());
      const rest = rows.filter(r => (r.market || '').toLowerCase() !== filterMarket.toLowerCase());
      return [...marketMatch, ...rest];
    }

    return rows;
  })();

  const handleSelect = (row) => {
    let offset = 0;
    if (currentPostDate && row.dueDate) {
      const postDateObj = new Date(currentPostDate);
      const dueDateStr = row.dueDate.split('T')[0];
      const [y, m, d] = dueDateStr.split('-').map(Number);
      const dueDateObj = new Date(y, m - 1, d);
      offset = Math.round((postDateObj - dueDateObj) / (1000 * 60 * 60 * 24));
    }
    onSelect(row.id, offset, row.task);
  };

  const handleUnlink = () => {
    onSelect(null, 0);
  };

  return (
    <div className={`linked-row-selector ${inline ? 'linked-row-selector-inline' : ''}`} ref={dropdownRef}>
      <div className="linked-row-selector-header">
        <span>Link to Editor Row</span>
        {!inline && (
          <button className="linked-row-selector-close" onClick={onClose}>&times;</button>
        )}
      </div>
      <div className="linked-row-selector-search">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus={!inline}
        />
      </div>
      {linkedTimelineId && (
        <button className="linked-row-unlink-btn" onClick={handleUnlink}>
          Unlink Current Row
        </button>
      )}
      <div className="linked-row-selector-list">
        {loading ? (
          <div className="linked-row-selector-loading">Loading...</div>
        ) : filteredRows.length === 0 ? (
          <div className="linked-row-selector-empty">No matching rows</div>
        ) : (
          filteredRows.map(row => {
            const isMarketMatch = filterMarket && (row.market || '').toLowerCase() === filterMarket.toLowerCase();
            return (
              <div
                key={row.id}
                className={`linked-row-selector-item ${row.id === linkedTimelineId ? 'active' : ''} ${isMarketMatch ? 'market-match' : ''}`}
                onClick={() => handleSelect(row)}
              >
                <div className="linked-row-item-left">
                  <span className="linked-row-market">{row.market || '-'}</span>
                  <span className="linked-row-separator">-</span>
                  <span className="linked-row-client">{row.clientSponsor || '-'}</span>
                  <span className="linked-row-separator">-</span>
                  <span className="linked-row-project">{row.project || '-'}</span>
                  <span className="linked-row-separator">-</span>
                  <span className="linked-row-task">{row.task || '-'}</span>
                </div>
                <span className="linked-row-date">{formatDate(row.dueDate)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LinkedRowSelector;