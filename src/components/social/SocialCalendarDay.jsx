import React, { useRef } from 'react';
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

export const SocialCalendarDay = ({ day, isToday, onDayClick }) => {
  const dayRef = useRef(null);

  const handleClick = () => {
    if (day.events.length === 0) return;

    const rect = dayRef.current.getBoundingClientRect();
    const position = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    };

    const dayOfWeek = day.date.getDay();
    if (dayOfWeek >= 5) {
      position.left = rect.right + window.scrollX - 350;
    }

    onDayClick(day.date, day.events, position);
  };

  const getEventColor = (event) => {
    const statusColor = socialColorConfig.statuses[event.status];
    if (statusColor) return statusColor;
    return '#3b82f6';
  };

  const groupedEvents = day.events.reduce((acc, event) => {
    const key = event.brand || 'No Brand';
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div
      ref={dayRef}
      className={`calendar-day ${day.isCurrentMonth ? '' : 'calendar-day-outside'} ${isToday ? 'calendar-day-today' : ''}`}
      onClick={handleClick}
    >
      <div className="calendar-day-header">
        <span className="calendar-day-number">{day.date.getDate()}</span>
      </div>
      <div className="calendar-day-content">
        {Object.entries(groupedEvents).slice(0, 3).map(([brand, events], index) => {
          const bgColor = getEventColor(events[0]);
          return (
            <div
              key={index}
              className="calendar-day-event social-calendar-event"
              style={{ backgroundColor: bgColor, color: '#fff' }}
            >
              <div className="calendar-event-project">{brand}</div>
              {events.length > 1 && (
                <div className="calendar-event-count">+{events.length}</div>
              )}
            </div>
          );
        })}
        {Object.keys(groupedEvents).length > 3 && (
          <div className="calendar-more-events">
            +{Object.keys(groupedEvents).length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialCalendarDay;
