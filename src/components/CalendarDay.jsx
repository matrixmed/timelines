import React, { useRef } from 'react';
import { colorConfig } from './ColorConfig';

export const CalendarDay = ({ day, isToday, onDayClick }) => {
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
        if (event.project && colorConfig.projects[event.project]) {
            return colorConfig.projects[event.project];
        }
        return '#E2E8F0';
    };
    
    const getContrastText = (bgColor) => {
        return colorConfig.getContrastText(bgColor);
    };
    
    const groupedEvents = day.events.reduce((acc, event) => {
        if (!acc[event.project]) {
            acc[event.project] = [];
        }
        acc[event.project].push(event);
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
                {Object.entries(groupedEvents).slice(0, 3).map(([project, events], index) => {
                    const bgColor = getEventColor(events[0]);
                    const textColor = getContrastText(bgColor);
                    
                    return (
                        <div 
                            key={index}
                            className="calendar-day-event"
                            style={{ backgroundColor: bgColor, color: textColor }}
                        >
                            <div className="calendar-event-project">{project}</div>
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

export default CalendarDay;