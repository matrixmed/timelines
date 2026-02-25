import React, { useState, useEffect, useCallback } from 'react';
import { useSocial } from './SocialProvider';
import { applySocialFilters } from './SocialFilters';
import { SocialCalendarDay } from './SocialCalendarDay';
import { SocialCalendarPopover } from './SocialCalendarPopover';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const SocialCalendar = ({ onDeleteClick }) => {
  const { data, filters, searchTerm } = useSocial();

  const filteredData = applySocialFilters(data, filters, searchTerm);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [showPopover, setShowPopover] = useState(false);

  const getCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = 42;
    const calendarDays = [];

    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = prevMonthDays - firstDayOfWeek + 1; i <= prevMonthDays; i++) {
      calendarDays.push({
        date: new Date(year, month - 1, i),
        isCurrentMonth: false,
        events: []
      });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      calendarDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        events: []
      });
    }

    const remainingDays = totalDays - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        events: []
      });
    }

    filteredData.forEach(event => {
      if (!event.postDate) return;

      const createConsistentDate = (dateValue) => {
        if (!dateValue) return null;
        if (typeof dateValue === 'string') {
          if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d] = dateValue.split('-').map(Number);
            return new Date(y, m - 1, d);
          } else if (dateValue.includes('T')) {
            const datePart = dateValue.split('T')[0];
            const [y, m, d] = datePart.split('-').map(Number);
            return new Date(y, m - 1, d);
          } else {
            const dateObj = new Date(dateValue);
            return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
          }
        } else if (dateValue instanceof Date) {
          return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
        }
        return null;
      };

      const eventDate = createConsistentDate(event.postDate);
      if (!eventDate || isNaN(eventDate.getTime())) return;

      calendarDays.forEach(day => {
        const dayDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
        const eventDateComp = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        if (dayDate.getTime() === eventDateComp.getTime()) {
          day.events.push(event);
        }
      });
    });

    return calendarDays;
  }, [currentMonth, filteredData]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prev.getMonth() - 1);
      return prevMonth;
    });
    setShowPopover(false);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + 1);
      return nextMonth;
    });
    setShowPopover(false);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setShowPopover(false);
  };

  const handleDayClick = (date, events, position) => {
    setSelectedDate(date);
    setSelectedEvents(events);
    setPopoverPosition(position);
    setShowPopover(true);
  };

  const handleClosePopover = () => {
    setShowPopover(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (showPopover && !event.target.closest('.calendar-popover') &&
        !event.target.closest('.calendar-day-events')) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPopover]);

  const calendarDays = getCalendarDays();

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button className="calendar-nav-button" onClick={goToPrevMonth}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="calendar-title">{formatMonth(currentMonth)}</h2>
          <button className="calendar-nav-button" onClick={goToNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button className="calendar-today-button" onClick={goToToday}>Today</button>
      </div>

      <div className="calendar-weekdays">
        <div className="calendar-weekday">Sun</div>
        <div className="calendar-weekday">Mon</div>
        <div className="calendar-weekday">Tue</div>
        <div className="calendar-weekday">Wed</div>
        <div className="calendar-weekday">Thu</div>
        <div className="calendar-weekday">Fri</div>
        <div className="calendar-weekday">Sat</div>
      </div>

      <div className="calendar-grid">
        {calendarDays.map((day, index) => (
          <SocialCalendarDay
            key={index}
            day={day}
            isToday={
              day.date.getDate() === new Date().getDate() &&
              day.date.getMonth() === new Date().getMonth() &&
              day.date.getFullYear() === new Date().getFullYear()
            }
            onDayClick={handleDayClick}
          />
        ))}
      </div>

      {showPopover && (
        <SocialCalendarPopover
          date={selectedDate}
          events={selectedEvents}
          position={popoverPosition}
          onClose={handleClosePopover}
          onDeleteClick={onDeleteClick}
        />
      )}
    </div>
  );
};

export default SocialCalendar;