import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useSocial } from './SocialProvider';
import { socialColorConfig } from './SocialColorConfig';
import { PlatformBadge } from './PlatformBadge';

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

export const SocialCalendarPopover = ({ date, events, position, onClose, onDeleteClick }) => {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      let d;
      if (dateStr instanceof Date) {
        d = dateStr;
      } else if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  };

  const formattedDate = formatDate(date);

  return (
    <div
      ref={popoverRef}
      className="calendar-popover social-calendar-popover"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="calendar-popover-header">
        <h3 className="calendar-popover-date">{formattedDate}</h3>
        <button className="calendar-popover-close" onClick={onClose}>×</button>
      </div>
      <div className="calendar-popover-content">
        {localEvents.length === 0 ? (
          <div className="calendar-popover-empty">No posts on this day</div>
        ) : (
          <div className="calendar-popover-events">
            {localEvents.map((event, index) => {
              const statusColor = socialColorConfig.statuses[event.status] || '#666';
              const eventPlatforms = parsePlatforms(event.platforms);

              return (
                <div key={index} className={`calendar-popover-event ${event.status === 'Standby' ? 'standby' : ''}`}>
                  <div className="calendar-popover-event-header"
                    style={{ backgroundColor: statusColor, color: '#fff' }}>
                    <div>{event.details || 'No Details'}</div>
                  </div>
                  <div className="calendar-popover-event-details">
                    <div className="calendar-popover-event-row">
                      <span className="calendar-popover-label">Brand:</span>
                      <span>{event.brand || '-'}</span>
                    </div>
                    <div className="calendar-popover-event-row">
                      <span className="calendar-popover-label">Owner:</span>
                      <span>{event.owner || '-'}</span>
                    </div>
                    {eventPlatforms.length > 0 && (
                      <div className="calendar-popover-event-row">
                        <span className="calendar-popover-label">Platforms:</span>
                        <span className="platform-badges">
                          {eventPlatforms.map(p => <PlatformBadge key={p} platform={p} />)}
                        </span>
                      </div>
                    )}
                    {event.content && (
                      <div className="calendar-popover-event-row">
                        <span className="calendar-popover-label">Content:</span>
                        <span className="popover-content-preview">{event.content.substring(0, 100)}{event.content.length > 100 ? '...' : ''}</span>
                      </div>
                    )}
                    <div className="calendar-popover-event-status">
                      <span className={`social-status-badge ${(event.status || '').toLowerCase().replace(/\s+/g, '-')}`}
                        style={{ backgroundColor: statusColor, color: '#fff' }}>
                        {event.status || 'In Progress'}
                      </span>
                    </div>
                    {event.linkedRowDeleted && (
                      <div className="linked-row-warning-inline">
                        Linked editor row was deleted
                      </div>
                    )}
                  </div>
                  <div className="calendar-popover-event-actions">
                    <button
                      className="action-button delete"
                      onClick={() => onDeleteClick(event)}
                      title="Delete Post"
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

export default SocialCalendarPopover;
