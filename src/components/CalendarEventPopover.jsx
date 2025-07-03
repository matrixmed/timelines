import React, { useEffect, useRef, useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useTimeline } from './TimelineProvider';
import { colorConfig } from './ColorConfig';
import config from '../config';

export const CalendarEventPopover = ({ date, events, position, onClose, onDeleteClick }) => {
  const timeline = useTimeline();
  const { toggleMissedDeadline } = timeline;
  const popoverRef = useRef(null);
  const [localEvents, setLocalEvents] = useState([]);

  useEffect(() => {
    setLocalEvents([...events]);
  }, [events]);

  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (rect.right > viewportWidth) {
        popoverRef.current.style.left = 'auto';
        popoverRef.current.style.right = '10px';
      }
      
      if (rect.bottom > viewportHeight) {
        const overflow = rect.bottom - viewportHeight;
        popoverRef.current.style.top = `${position.top - overflow - 20}px`;
      }
    }
  }, [position]);

  const fixDateOffset = (dateString) => {
    if (!dateString) return '';
    
    let date;
    if (dateString instanceof Date) {
      date = new Date(dateString);
    }
    else if (typeof dateString === 'string') {
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
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return dateStr;
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  const formattedDate = formatDate(date);

  const getEventColor = (event) => {
    if (event.project && colorConfig.projects[event.project]) {
      return colorConfig.projects[event.project];
    }
    return '#E2E8F0';
  };

  const getContrastText = (bgColor) => {
    return colorConfig.getContrastText(bgColor);
  };

  const toggleComplete = async (rowId) => {
    try {
      setLocalEvents(prevEvents => 
        prevEvents.map(e => e.id === rowId ? { ...e, complete: !e.complete } : e)
      );
      
      const event = localEvents.find(e => e.id === rowId);
      if (!event) return;
      
      const response = await fetch(`${config.apiUrl}/api/timelines/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          complete: !event.complete
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling complete status:', error);
      setLocalEvents(prevEvents => 
        prevEvents.map(e => e.id === rowId ? { ...e, complete: !e.complete } : e)
      );
    }
  };

  const handleToggleMissedDeadline = (id) => {
    setLocalEvents(prevEvents => 
      prevEvents.map(e => e.id === id ? {...e, missedDeadline: !e.missedDeadline} : e)
    );
    
    toggleMissedDeadline(id);
  };

  return (
    <div
      ref={popoverRef}
      className="calendar-popover"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="calendar-popover-header">
        <h3 className="calendar-popover-date">{formattedDate}</h3>
        <button className="calendar-popover-close" onClick={onClose}>×</button>
      </div>
      <div className="calendar-popover-content">
        {localEvents.length === 0 ? (
          <div className="calendar-popover-empty">No events on this day</div>
        ) : (
          <div className="calendar-popover-events">
            {localEvents.map((event, index) => {
              const bgColor = getEventColor(event);
              const textColor = getContrastText(bgColor);
              return (
                <div 
                  key={index} 
                  className={`calendar-popover-event ${event.missedDeadline ? 'missed-deadline' : ''}`}
                >
                  <div
                    className="calendar-popover-event-header"
                    style={{ backgroundColor: bgColor, color: textColor }}
                  >
                    <div>{event.project || 'No Project'}</div>
                  </div>
                  <div className="calendar-popover-event-details">
                    <div className="calendar-popover-event-row">
                      <span className="calendar-popover-label">Market:</span>
                      <span>{event.market || '-'}</span>
                    </div>
                    <div className="calendar-popover-event-row">
                      <span className="calendar-popover-label">Brand:</span>
                      <span>{event.clientSponsor || '-'}</span>
                    </div>
                    <div className="calendar-popover-event-row">
                      <span className="calendar-popover-label">Team:</span>
                      <span>{event.team || '-'}</span>
                    </div>
                    <div className="calendar-popover-event-row">
                      <span className="calendar-popover-label">Task:</span>
                      <span>{event.task || '-'}</span>
                    </div>
                    {event.notes && (
                      <div className="calendar-popover-event-row">
                        <span className="calendar-popover-label">Notes:</span>
                        <span>{event.notes}</span>
                      </div>
                    )}
                    <div className="calendar-popover-event-status">
                      <span 
                        className={`calendar-popover-status ${event.complete ? 'completed' : 'pending'}`}
                        onClick={() => toggleComplete(event.id)}
                        title="Click to toggle status"
                        style={{ cursor: 'pointer' }}
                      >
                        {event.complete ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="calendar-popover-event-actions">
                    <button
                      className={`action-button deadline-toggle ${event.missedDeadline ? 'active' : ''}`}
                      onClick={() => handleToggleMissedDeadline(event.id)}
                      title="Toggle Missed Deadline"
                    >
                      <AlertCircle size={18} />
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => onDeleteClick(event)}
                      title="Delete Row"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};