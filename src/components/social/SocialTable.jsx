import React, { useRef, useEffect, useCallback, memo, useState } from 'react';
import { useSocial } from './SocialProvider';
import NewSocialRow from './NewSocialRow';
import { Check, X, Trash2, Link2, History, StickyNote } from 'lucide-react';
import { platforms, socialStatuses, socialBrands, contentTypes, brandMarketMap } from './SocialFields';
import { socialColorConfig } from './SocialColorConfig';
import { applySocialFilters } from './SocialFilters';
import { PlatformBadge } from './PlatformBadge';
import { LinkedRowSelector } from './LinkedRowSelector';
import config from '../../config';

const fixDateOffset = (dateString) => {
  if (!dateString) return '';
  let date;
  if (dateString instanceof Date) {
    date = new Date(dateString);
  } else if (typeof dateString === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      const parts = new Date(dateString).toISOString().split('T')[0].split('-');
      date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    }
  } else {
    return dateString;
  }
  return date;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = fixDateOffset(dateStr);
    if (!(date instanceof Date) || isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const isInSameWeek = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const weekStart1 = new Date(d1);
  weekStart1.setDate(d1.getDate() - d1.getDay());
  const weekStart2 = new Date(d2);
  weekStart2.setDate(d2.getDate() - d2.getDay());
  return weekStart1.getTime() === weekStart2.getTime();
};

const parsePlatforms = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const SocialCell = memo(({
  field, value, row, isPending, isEditing, onCellClick,
  onValueChange, commitChanges, cancelChanges, socket
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => { setLocalValue(value); }, [value]);
  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  if (isEditing) {
    const handleBlur = () => {
      if (localValue !== value) onValueChange(localValue);
      if (!isPending) commitChanges(row.id);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (localValue !== value) onValueChange(localValue);
        commitChanges(row.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelChanges(row.id);
      }
    };

    const commonProps = {
      autoFocus: true,
      ref: inputRef,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown
    };

    if (field === 'brand') {
      return (
        <select
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          className="cell-select"
          {...commonProps}
        >
          <option value="">Select brand</option>
          {socialBrands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      );
    }

    if (field === 'status') {
      return (
        <select
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          className="cell-select"
          {...commonProps}
        >
          {socialStatuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }

    if (field === 'platforms') {
      const selected = parsePlatforms(localValue);
      const togglePlatform = (p) => {
        const newSelected = selected.includes(p)
          ? selected.filter(x => x !== p)
          : [...selected, p];
        const newValue = JSON.stringify(newSelected);
        setLocalValue(newValue);
        onValueChange(newValue);
      };

      return (
        <div className="platform-multi-select" onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            if (!isPending) commitChanges(row.id);
          }
        }}>
          {platforms.map(p => (
            <label key={p} className={`platform-checkbox ${selected.includes(p) ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(p)}
                onChange={() => togglePlatform(p)}
              />
              <PlatformBadge platform={p} />
            </label>
          ))}
        </div>
      );
    }

    if (field === 'postDate') {
      return (
        <div className="date-picker-container">
          <input
            type="date"
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            className="cell-date-input"
            {...commonProps}
          />
        </div>
      );
    }

    if (field === 'content') {
      return (
        <select
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          className="cell-select"
          {...commonProps}
        >
          <option value="">Select type</option>
          {contentTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      );
    }

    if (field === 'details') {
      return (
        <textarea
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          className="cell-textarea"
          {...commonProps}
        />
      );
    }

    return (
      <input
        type="text"
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        className="cell-input"
        {...commonProps}
      />
    );
  }

  if (field === 'details') {
    return (
      <div className="cell-content cell-content-details" onClick={() => !isPending && onCellClick()}>
        {value || ''}
      </div>
    );
  }

  if (field === 'content' && value) {
    const bgColor = socialColorConfig.contentTypes[value];
    if (bgColor) {
      return (
        <div className="cell-content" onClick={() => !isPending && onCellClick()}>
          <span className="content-type-badge"
            style={{ backgroundColor: bgColor, color: '#fff' }}>
            {value}
          </span>
        </div>
      );
    }
  }

  if (field === 'platforms') {
    const selected = parsePlatforms(value);
    if (selected.length === 0) return <div className="cell-content" onClick={() => !isPending && onCellClick()}>-</div>;
    return (
      <div className="cell-content platform-badges" onClick={() => !isPending && onCellClick()}>
        {selected.map(p => <PlatformBadge key={p} platform={p} compact />)}
      </div>
    );
  }

  if (field === 'status') {
    const statusColor = socialColorConfig.statuses[value] || '#666';
    return (
      <div className="cell-content" onClick={() => !isPending && onCellClick()}>
        <span className={`social-status-badge ${(value || '').toLowerCase().replace(/\s+/g, '-')}`}
          style={{ backgroundColor: statusColor, color: '#fff' }}>
          {value || '-'}
        </span>
      </div>
    );
  }

  if (field === 'brand' && value) {
    const bgColor = socialColorConfig.brands[value];
    if (bgColor) {
      return (
        <div className="cell-content" onClick={() => !isPending && onCellClick()}>
          <div style={{
            backgroundColor: bgColor,
            color: socialColorConfig.getContrastText(bgColor),
            padding: '3px 8px',
            borderRadius: '4px',
            display: 'inline-block',
            maxWidth: '95%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {value}
          </div>
        </div>
      );
    }
  }

  if (field === 'postDate') {
    const dateClass = row.linkedMissedDeadline ? 'post-date-missed' :
                      row.dateChanged ? 'post-date-changed' : '';
    return (
      <div className={`cell-content ${dateClass}`} onClick={() => !isPending && onCellClick()}>
        {formatDate(value)}
      </div>
    );
  }

  if (field === 'notes') {
    if (!value) {
      return <div className="cell-content cell-content-multiline">{''}</div>;
    }
    const lines = value.split('\n').filter(l => l.trim());
    const firstLine = lines[0] || '';
    const handleTriggerEnter = (e) => {
      const popover = popoverRef.current;
      if (!popover) return;
      const rect = e.currentTarget.getBoundingClientRect();
      popover.style.display = 'block';
      let top = rect.top - popover.offsetHeight - 8;
      let left = rect.left;
      if (top < 8) top = rect.bottom + 8;
      if (left + popover.offsetWidth > window.innerWidth - 16) {
        left = window.innerWidth - popover.offsetWidth - 16;
      }
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    };
    const handleTriggerLeave = () => {
      const popover = popoverRef.current;
      if (popover) popover.style.display = 'none';
    };
    return (
      <div className="updates-cell-wrapper">
        <div className="cell-content cell-content-multiline">
          <span className="auto-note-line">{firstLine}</span>
          {lines.length > 1 && (
            <span
              className="updates-history-trigger"
              onMouseEnter={handleTriggerEnter}
              onMouseLeave={handleTriggerLeave}
            >
              <History size={13} className="updates-history-icon" />
              <div className="updates-history-popover" ref={popoverRef}>
                <div className="updates-history-title">Update History ({lines.length})</div>
                {lines.map((line, i) => (
                  <div key={i} className="updates-history-entry">{line}</div>
                ))}
              </div>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cell-content"
      onClick={() => !isPending && onCellClick()}>
      {value || ''}
    </div>
  );
});

const UserNotesPopover = ({ row, onSave }) => {
  const [mode, setMode] = useState('closed');
  const [noteText, setNoteText] = useState(row.userNotes || '');
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const hasNotes = !!(row.userNotes && row.userNotes.trim());

  useEffect(() => { setNoteText(row.userNotes || ''); }, [row.userNotes]);

  useEffect(() => {
    if (mode === 'closed') return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setNoteText(row.userNotes || '');
        setMode('closed');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode, row.userNotes]);

  const positionPopover = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popover = popoverRef.current;
    let top = rect.bottom + 6;
    let left = rect.left - popover.offsetWidth + rect.width;
    if (left < 16) left = 16;
    if (top + popover.offsetHeight > window.innerHeight - 16) {
      top = rect.top - popover.offsetHeight - 6;
    }
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }, []);

  useEffect(() => {
    if (mode !== 'closed') setTimeout(positionPopover, 0);
  }, [mode, positionPopover]);

  const handleSave = () => {
    onSave(row.id, noteText);
    setMode('closed');
  };

  const handleClick = () => {
    if (mode === 'closed') {
      setMode(hasNotes ? 'viewing' : 'editing');
    }
  };

  const handleMouseEnter = () => {
    if (mode === 'closed' && hasNotes) {
      setMode('viewing');
    }
  };
  const handleMouseLeave = (e) => {
    if (mode === 'viewing') {
      if (popoverRef.current && popoverRef.current.contains(e.relatedTarget)) return;
      setMode('closed');
    }
  };
  const handlePopoverLeave = (e) => {
    if (mode === 'viewing') {
      if (triggerRef.current && triggerRef.current.contains(e.relatedTarget)) return;
      setMode('closed');
    }
  };

  return (
    <div className="user-notes-wrapper">
      <button
        ref={triggerRef}
        className={`action-button user-notes-btn ${hasNotes ? 'has-notes' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={hasNotes ? 'View/edit notes' : 'Add notes'}
      >
        <StickyNote size={16} />
      </button>
      {mode !== 'closed' && (
        <div
          className="user-notes-popover"
          ref={popoverRef}
          onMouseLeave={handlePopoverLeave}
        >
          {mode === 'viewing' && (
            <>
              <div className="user-notes-popover-header">
                <span className="user-notes-popover-title">Notes</span>
                <button className="user-notes-edit-btn" onClick={() => setMode('editing')}>Edit</button>
              </div>
              <div className="user-notes-read-only">{row.userNotes}</div>
            </>
          )}
          {mode === 'editing' && (
            <>
              <div className="user-notes-popover-title">Notes</div>
              <textarea
                className="user-notes-textarea"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes..."
                rows={4}
                autoFocus
              />
              <div className="user-notes-popover-actions">
                <button className="user-notes-save-btn" onClick={handleSave}>Save</button>
                <button className="user-notes-cancel-btn" onClick={() => { setNoteText(row.userNotes || ''); setMode('closed'); }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SocialTableRow = memo(({
  row, isPending, editingCell, editedRows,
  renderActionButtons, setEditingCell,
  updateCell, updatePendingCell,
  commitRowChanges, cancelRowChanges,
  clearEditForField, socket
}) => {
  const isStandby = row.status === 'Standby';
  const isLinkedDeleted = row.linkedRowDeleted;
  const isCurrentWeek = row.postDate && isInSameWeek(new Date(), fixDateOffset(row.postDate));

  return (
    <tr className={`${editedRows[row.id] ? 'row-edited' : ''} ${isStandby ? 'social-row-standby' : ''} ${isLinkedDeleted ? 'social-row-linked-deleted' : ''} ${isCurrentWeek ? 'social-row-current-week' : ''}`}
      data-current-week={isCurrentWeek || undefined}>
      {['details', 'content', 'brand', 'platforms', 'postDate', 'postTime',
        'status', 'notes'].map(field => (
        <td key={field} className="cell">
          <SocialCell
            field={field}
            value={row[field]}
            row={row}
            isPending={isPending}
            isEditing={field !== 'notes' && (
              (isPending && row.id.toString().startsWith('pending-')) ||
              (!isPending && editingCell?.rowId === row.id && editingCell?.field === field)
            )}
            onCellClick={() => field !== 'notes' && setEditingCell({ rowId: row.id, field })}
            onValueChange={(value) => isPending ?
              updatePendingCell(row.id, field, value) :
              updateCell(row.id, field, value)}
            commitChanges={commitRowChanges}
            cancelChanges={cancelRowChanges}
            clearEditForField={clearEditForField}
            socket={socket}
          />
        </td>
      ))}
      <td className="cell center">
        {renderActionButtons(row, isPending)}
      </td>
    </tr>
  );
});

export const SocialTable = ({ onDeleteClick }) => {
  const {
    data, filters, searchTerm, editingCell, editedRows,
    pendingRows, pendingEdits, setEditingCell,
    updateCell, updatePendingCell, commitRowChanges,
    cancelRowChanges, commitPendingRow, removePendingRow,
    clearEditForField, socket, dismissLinkedRowWarning
  } = useSocial();

  const filteredData = React.useMemo(() =>
    applySocialFilters(data, filters, searchTerm),
    [data, filters, searchTerm]
  );

  const tableRef = useRef(null);
  const [linkingRowId, setLinkingRowId] = useState(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!hasScrolled && filteredData.length > 0 && tableRef.current) {
      const currentWeekRow = tableRef.current.querySelector('tr[data-current-week]');
      if (currentWeekRow) {
        currentWeekRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHasScrolled(true);
    }
  }, [filteredData, hasScrolled]);

  const columnOrder = [
    'details', 'content', 'brand', 'platforms', 'postDate', 'postTime',
    'status'
  ];

  const handleKeyDown = useCallback((e) => {
    if (!editingCell) return;

    const { rowId, field } = editingCell;
    const currentColIndex = columnOrder.indexOf(field);
    const allRows = [...pendingRows, ...filteredData];
    const currentRowIndex = allRows.findIndex(row => row.id === rowId);

    switch (e.key) {
      case 'Escape':
        if (editedRows[rowId]) {
          cancelRowChanges(rowId);
        } else {
          setEditingCell(null);
        }
        e.preventDefault();
        break;
      case 'Enter':
        if (e.shiftKey) {
          if (currentRowIndex > 0) {
            setEditingCell({ rowId: allRows[currentRowIndex - 1].id, field });
          }
        } else {
          if (editedRows[rowId]) commitRowChanges(rowId);
          if (currentRowIndex < allRows.length - 1) {
            setEditingCell({ rowId: allRows[currentRowIndex + 1].id, field });
          }
        }
        e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          if (currentColIndex > 0) {
            setEditingCell({ rowId, field: columnOrder[currentColIndex - 1] });
          }
        } else {
          if (currentColIndex < columnOrder.length - 1) {
            setEditingCell({ rowId, field: columnOrder[currentColIndex + 1] });
          }
        }
        e.preventDefault();
        break;
      default:
        break;
    }
  }, [editingCell, columnOrder, pendingRows, filteredData, editedRows, cancelRowChanges, setEditingCell, commitRowChanges]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const saveUserNotes = useCallback(async (rowId, noteText) => {
    const currentRow = data.find(r => r.id === rowId);
    if (!currentRow) return;
    const updatedRow = { ...currentRow, userNotes: noteText };
    try {
      const response = await fetch(`${config.apiUrl}/api/social/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow)
      });
      if (response.ok) {
        socket?.emit('update-social', updatedRow);
      }
    } catch (err) {
      console.error('Error saving user notes:', err);
    }
  }, [data, socket]);

  const handleLinkRow = useCallback((rowId) => {
    setLinkingRowId(linkingRowId === rowId ? null : rowId);
  }, [linkingRowId]);

  const handleLinkSelect = useCallback(async (rowId, timelineId, offset) => {
    const currentRow = data.find(r => r.id === rowId);
    if (!currentRow) return;

    const updatedRow = {
      ...currentRow,
      linkedTimelineId: timelineId,
      linkedDateOffset: offset,
      linkedRowDeleted: false
    };

    try {
      const response = await fetch(`${config.apiUrl}/api/social/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow)
      });
      if (response.ok) {
        socket?.emit('update-social', updatedRow);
      }
    } catch (err) {
      console.error('Error linking row:', err);
    }

    setLinkingRowId(null);
  }, [data, socket]);

  const renderActionButtons = useCallback((row, isPending = false) => {
    if (isPending) {
      return (
        <div className="action-buttons">
          <button className="action-button submit" onClick={() => commitPendingRow(row.id)} title="Save">
            <Check size={18} />
          </button>
          <button className="action-button cancel" onClick={() => removePendingRow(row.id)} title="Cancel">
            <X size={18} />
          </button>
        </div>
      );
    }

    return (
      <div className="action-buttons">
        <UserNotesPopover row={row} onSave={saveUserNotes} />
        <button
          className={`action-button link-toggle ${row.linkedTimelineId ? 'active' : ''}`}
          onClick={() => handleLinkRow(row.id)}
          title={row.linkedTimelineId ? 'Linked to editor row' : 'Link to editor row'}
        >
          <Link2 size={16} />
        </button>
        <button
          className="action-button delete"
          onClick={() => onDeleteClick(row)}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }, [commitPendingRow, removePendingRow, onDeleteClick, handleLinkRow, saveUserNotes, linkingRowId, handleLinkSelect, dismissLinkedRowWarning]);

  const linkingRow = linkingRowId ? data.find(r => r.id === linkingRowId) : null;

  return (
    <div className="table-container" ref={tableRef}>
      {pendingRows.length > 0 && (
        <div className="pending-rows-container">
          {pendingRows.map(row => (
            <NewSocialRow
              key={row.id}
              row={row}
              onClose={() => removePendingRow(row.id)}
            />
          ))}
        </div>
      )}
      <table className="timelines-table social-table">
        <thead className="sticky-header">
          <tr>
            {['Details', 'Content', 'Brand', 'Platform', 'Post Date', 'Time',
              'Status', 'Updates', 'Actions'].map(header => (
              <th key={header}>
                <div className="header-content">
                  <span className="header-text">{header}</span>
                  {header !== 'Actions' &&
                    <span className="header-filter-icon" data-column={header} data-table="social">
                    </span>
                  }
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map(row => (
            <React.Fragment key={row.id}>
              {row.linkedRowDeleted && (
                <tr className="linked-row-warning-row">
                  <td colSpan="9">
                    <div className="linked-row-warning">
                      Linked editor row was deleted.
                      <button onClick={() => dismissLinkedRowWarning(row.id)}>Dismiss</button>
                      <button onClick={() => onDeleteClick(row)}>Delete Post</button>
                    </div>
                  </td>
                </tr>
              )}
              <SocialTableRow
                row={row}
                isPending={false}
                editingCell={editingCell}
                editedRows={editedRows}
                renderActionButtons={renderActionButtons}
                setEditingCell={setEditingCell}
                updateCell={updateCell}
                updatePendingCell={updatePendingCell}
                commitRowChanges={commitRowChanges}
                cancelRowChanges={cancelRowChanges}
                clearEditForField={clearEditForField}
                socket={socket}
              />
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {linkingRow && (
        <div className="linked-row-modal-overlay" onClick={() => setLinkingRowId(null)}>
          <div className="linked-row-modal" onClick={(e) => e.stopPropagation()}>
            <LinkedRowSelector
              currentPostDate={linkingRow.postDate}
              linkedTimelineId={linkingRow.linkedTimelineId}
              onSelect={(timelineId, offset) => handleLinkSelect(linkingRowId, timelineId, offset)}
              onClose={() => setLinkingRowId(null)}
              filterMarket={linkingRow.brand ? brandMarketMap[linkingRow.brand] : null}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialTable;