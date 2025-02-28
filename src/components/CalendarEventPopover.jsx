import React, { useEffect, useRef } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useTimeline } from './TimelineProvider';
import { colorConfig } from './ColorConfig';

export const CalendarEventPopover = ({ date, events, position, onClose, onDeleteClick }) => {
    const { toggleMissedDeadline } = useTimeline();
    const popoverRef = useRef(null);
    
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
    
    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
                {events.length === 0 ? (
                    <div className="calendar-popover-empty">No events on this day</div>
                ) : (
                    <div className="calendar-popover-events">
                        {events.map((event, index) => {
                            const bgColor = getEventColor(event);
                            const textColor = getContrastText(bgColor);
                            
                            return (
                                <div key={index} className="calendar-popover-event">
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
                                            <span className="calendar-popover-label">Client:</span>
                                            <span>{event.clientSponsor || '-'}</span>
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
                                            <span className={`calendar-popover-status ${event.complete ? 'completed' : 'pending'}`}>
                                                {event.complete ? 'Completed' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="calendar-popover-event-actions">
                                        <button 
                                            className={`action-button deadline-toggle ${event.missedDeadline ? 'active' : ''}`}
                                            onClick={() => toggleMissedDeadline(event.id)}
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