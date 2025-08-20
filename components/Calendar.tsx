import React from 'react';
import { Task } from '../types';
import { WEEK_DAY_NAMES } from '../constants';

interface CalendarProps {
    year: number;
    month: number;
    todayDate: Date;
    selectedDate: string;
    getTasksForDate: (dateString: string) => Task[];
    onDateSelect: (dateString: string) => void;
}

const dateToYMD = (date: Date): string => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

const Calendar: React.FC<CalendarProps> = ({ year, month, todayDate, selectedDate, getTasksForDate, onDateSelect }) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayYMD = dateToYMD(todayDate);

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getDayInfo = (day: number) => {
        const date = new Date(year, month, day);
        const dateString = dateToYMD(date);
        const dayTasks = getTasksForDate(dateString);
        const total = dayTasks.length;
        const completed = dayTasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : -1;
        
        let colorClass = 'bg-gray-300 dark:bg-slate-700';
        if (percentage > 20) colorClass = 'bg-yellow-400 dark:bg-yellow-500';
        if (percentage > 50) colorClass = 'bg-orange-400 dark:bg-orange-500';
        if (percentage >= 70) colorClass = 'bg-green-500 dark:bg-green-600';

        return { dateString, percentage, colorClass };
    };

    return (
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {WEEK_DAY_NAMES.map(name => (
                <div key={name} className="font-bold text-gray-500 dark:text-slate-400">{name}</div>
            ))}
            {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
            {days.map(day => {
                const { dateString, percentage, colorClass } = getDayInfo(day);
                const isToday = dateString === todayYMD;
                const isSelected = dateString === selectedDate;
                
                let dayClasses = 'calendar-day p-1 cursor-pointer flex flex-col items-center justify-center h-12 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-slate-700';
                if (isToday) dayClasses += ' today';
                if (isSelected) dayClasses += ' selected';

                return (
                    <div key={day} className={dayClasses} onClick={() => onDateSelect(dateString)}>
                        <span>{day}</span>
                        {percentage > -1 && <div className={`w-6 h-1.5 mt-1 ${colorClass} rounded-full`}></div>}
                    </div>
                );
            })}
        </div>
    );
};

export default Calendar;