import React, { useRef } from 'react';
import { Task } from '../types';
import { WEEK_DAY_NAMES } from '../constants';
import Calendar from './Calendar';
import DonutChart from './DonutChart';

interface GraphViewProps {
    todayDate: Date;
    getTasksForDate: (dateString: string) => Task[];
    currentCalendarDate: Date;
    setCurrentCalendarDate: (date: Date) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    onSetToday: (dateString: string) => void;
    onSwipeRight: () => void;
}

const GraphView: React.FC<GraphViewProps> = ({
    todayDate,
    getTasksForDate,
    currentCalendarDate,
    setCurrentCalendarDate,
    selectedDate,
    setSelectedDate,
    onSetToday,
    onSwipeRight
}) => {
    const touchStartX = useRef<number | null>(0);
    const date = new Date(selectedDate);
    // Adjust for timezone offset to prevent day-before issue
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const dayName = WEEK_DAY_NAMES[date.getDay()];

    const dayTasks = getTasksForDate(selectedDate);
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const handlePrevMonth = () => {
        const newDate = new Date(currentCalendarDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentCalendarDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentCalendarDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentCalendarDate(newDate);
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        // Do not trigger navigation swipe if the touch starts on an interactive element.
        if (target.closest('button, .calendar-day')) {
            touchStartX.current = null;
            return;
        }
        touchStartX.current = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) {
            return;
        }
        const touchendX = e.changedTouches[0].screenX;
        const swipeThreshold = window.innerWidth / 4;
        if (touchendX > touchStartX.current + swipeThreshold) {
            onSwipeRight();
        }
    };


    return (
        <div 
            className="app-view w-screen h-full flex-shrink-0 flex flex-col p-4 sm:p-6 bg-white dark:bg-slate-900"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <header className="flex-shrink-0 text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">월간 달성률</h2>
                <p className="text-center text-gray-500 dark:text-slate-400 mt-1">오른쪽으로 스와이프하여 목록으로 돌아가세요.</p>
            </header>
            <div className="flex-grow flex flex-col items-center justify-between">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800">&lt;</button>
                        <h3 className="text-lg font-bold">{`${currentCalendarDate.getFullYear()}년 ${currentCalendarDate.getMonth() + 1}월`}</h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800">&gt;</button>
                    </div>
                    <Calendar
                        year={currentCalendarDate.getFullYear()}
                        month={currentCalendarDate.getMonth()}
                        todayDate={todayDate}
                        selectedDate={selectedDate}
                        getTasksForDate={getTasksForDate}
                        onDateSelect={setSelectedDate}
                    />
                    <div className="mt-4 text-center">
                        <button onClick={() => onSetToday(selectedDate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">선택한 날을 오늘로 설정</button>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-4">{`${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName}) 달성률`}</h3>
                    <DonutChart percentage={percentage} />
                </div>
            </div>
        </div>
    );
};

export default GraphView;