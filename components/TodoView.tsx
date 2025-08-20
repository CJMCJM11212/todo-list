import React, { useEffect, useRef, useState } from 'react';
import { Task, FilterType, DeletedItem } from '../types';
import DayColumn from './DayColumn';
import { DAY_IDS, WEEK_DAY_NAMES } from '../constants';
import TrashModal from './TrashModal';

interface TodoViewProps {
    todayDate: Date;
    getTasksForDate: (dateString: string) => Task[];
    updateTasksForDate: (dateString: string, newTasks: Task[]) => void;
    filterType: FilterType;
    setFilterType: (filter: FilterType) => void;
    onSwipeLeft: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    deletedTasks: DeletedItem[];
    onMoveTaskToTrash: (taskId: string, fromDate: string) => void;
    onRestoreTask: (item: DeletedItem) => void;
}

const dateToYMD = (date: Date): string => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

const TodoView: React.FC<TodoViewProps> = ({
    todayDate,
    getTasksForDate,
    updateTasksForDate,
    filterType,
    setFilterType,
    onSwipeLeft,
    isDarkMode,
    toggleDarkMode,
    deletedTasks,
    onMoveTaskToTrash,
    onRestoreTask
}) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(0);
    const [isTrashOpen, setIsTrashOpen] = useState(false);

    useEffect(() => {
        const board = boardRef.current;
        if (board) {
            const todayIndex = todayDate.getDay();
            board.scrollTop = todayIndex * board.clientHeight;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [todayDate, boardRef]);

    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        // Do not trigger navigation swipe if the touch starts on an interactive element.
        if (target.closest('.task, .new-task-input, .filter-btn, button')) {
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
        if (touchendX < touchStartX.current - swipeThreshold) {
            onSwipeLeft();
        }
    };


    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - todayDate.getDay());
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDates.push(date);
    }

    const toggleRemaining = () => {
      if (filterType === FilterType.ALL) {
        setFilterType(FilterType.REMAINING);
      } else {
        setFilterType(FilterType.ALL);
      }
    };
    
    const toggleOne = () => {
      if (filterType !== FilterType.ONE) {
        setFilterType(FilterType.ONE);
      } else {
        setFilterType(FilterType.REMAINING);
      }
    }

    return (
        <div 
            className="app-view w-screen h-full flex-shrink-0 flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <header className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 flex-shrink-0 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div className="w-8 h-8"></div> {/* Spacer */}
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">주간 할 일 목록</h1>
                        <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-1">왼쪽으로 스와이프하여 그래프 보기</p>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Toggle dark mode"
                    >
                        {isDarkMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="flex justify-center space-x-2 mt-2">
                    <button onClick={toggleRemaining} className={`filter-btn px-3 py-1 text-sm border rounded-full border-gray-300 dark:border-slate-600 ${filterType === FilterType.REMAINING || filterType === FilterType.ONE ? 'active' : ''}`}>남은 할 일만</button>
                    <button onClick={toggleOne} className={`filter-btn px-3 py-1 text-sm border rounded-full border-gray-300 dark:border-slate-600 ${filterType === FilterType.ONE ? 'active' : ''}`}>하나만 표시</button>
                </div>
            </header>
            <main ref={boardRef} className="day-scroll-container flex-grow">
                {weekDates.map(date => (
                    <DayColumn
                        key={dateToYMD(date)}
                        date={date}
                        isToday={dateToYMD(date) === dateToYMD(todayDate)}
                        tasks={getTasksForDate(dateToYMD(date))}
                        updateTasks={tasks => updateTasksForDate(dateToYMD(date), tasks)}
                        onDelete={taskId => onMoveTaskToTrash(taskId, dateToYMD(date))}
                        filterType={filterType}
                        isDarkMode={isDarkMode}
                    />
                ))}
            </main>
            <button
                onClick={() => setIsTrashOpen(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 z-20"
                aria-label="휴지통 보기"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            <TrashModal
                isOpen={isTrashOpen}
                onClose={() => setIsTrashOpen(false)}
                deletedTasks={deletedTasks}
                onRestoreTask={onRestoreTask}
            />
        </div>
    );
};

export default TodoView;