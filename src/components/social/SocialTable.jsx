import React, { useRef, useEffect, useCallback, memo, useState } from 'react';
import { useSocial } from './SocialProvider';
import NewSocialRow from './NewSocialRow';
import { Check, X, Trash2, Link2 } from 'lucide-react';
import { platforms, socialStatuses } from './SocialFields';
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
          {Object.keys(socialColorConfig.brands).map(b => (
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

    if (field === 'content' || field === 'notes') {
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

  if (field === 'platforms') {
    const selected = parsePlatforms(value);
    if (selected.length === 0) return <div className="cell-content" onClick={() => !isPending && onCellClick()}>-</div>;
    return (
      <div className="cell-content platform-badges" onClick={() => !isPending && onCellClick()}>
        {selected.map(p => <PlatformBadge key={p} platform={p} />)}
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
    return (
      <div className="cell-content" onClick={() => !isPending && onCellClick()}>
        {formatDate(value)}
      </div>
    );
  }

  return (
    <div className={`cell-content ${(field === 'content' || field === 'notes') ? 'cell-content-multiline' : ''}`}
      onClick={() => !isPending && onCellClick()}>
      {value || ''}
    </div>
  );
});

const SocialTableRow = memo(({
  row, isPending, editingCell, editedRows,
  renderActionButtons, setEditingCell,
  updateCell, updatePendingCell,
  commitRowChanges, cancelRowChanges,
  clearEditForField, socket
}) => {
  const isStandby = row.status === 'Standby';
  const isLinkedDeleted = row.linkedRowDeleted;

  return (
    <tr className={`${editedRows[row.id] ? 'row-edited' : ''} ${isStandby ? 'social-row-standby' : ''} ${isLinkedDeleted ? 'social-row-linked-deleted' : ''}`}>
      {['details', 'brand', 'content', 'platforms', 'postDate',
        'status', 'owner', 'notes'].map(field => (
        <td key={field} className="cell">
          <SocialCell
            field={field}
            value={row[field]}
            row={row}
            isPending={isPending}
            isEditing={(isPending && row.id.toString().startsWith('pending-')) ||
              (!isPending && editingCell?.rowId === row.id && editingCell?.field === field)}
            onCellClick={() => setEditingCell({ rowId: row.id, field })}
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

  const columnOrder = [
    'details', 'brand', 'content', 'platforms', 'postDate',
    'status', 'owner', 'notes'
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
      <div className="action-buttons" style={{ position: 'relative' }}>
        <button
          className={`action-button link-toggle ${row.linkedTimelineId ? 'active' : ''}`}
          onClick={() => handleLinkRow(row.id)}
          title={row.linkedTimelineId ? 'Linked to editor row' : 'Link to editor row'}
        >
          <Link2 size={18} />
        </button>
        {row.linkedRowDeleted && (
          <button
            className="action-button warning-dismiss"
            onClick={() => dismissLinkedRowWarning(row.id)}
            title="Dismiss linked row warning"
          >
            !
          </button>
        )}
        <button
          className="action-button delete"
          onClick={() => onDeleteClick(row)}
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
        {linkingRowId === row.id && (
          <LinkedRowSelector
            currentPostDate={row.postDate}
            linkedTimelineId={row.linkedTimelineId}
            onSelect={(timelineId, offset) => handleLinkSelect(row.id, timelineId, offset)}
            onClose={() => setLinkingRowId(null)}
          />
        )}
      </div>
    );
  }, [commitPendingRow, removePendingRow, onDeleteClick, handleLinkRow, linkingRowId, handleLinkSelect, dismissLinkedRowWarning]);

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
            {['Details', 'Brand', 'Content', 'Platform', 'Post Date',
              'Status', 'Owner', 'Notes', 'Actions'].map(header => (
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
    </div>
  );
};

export default SocialTable;
