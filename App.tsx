import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, DailyTasks, FilterType, DeletedItem } from './types';
import { DAY_IDS, DEFAULT_TASKS } from './constants';
import TodoView from './components/TodoView';
import GraphView from './components/GraphView';

const dateToYMD = (date: Date): string => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

const App: React.FC = () => {
    const [todayDate, setTodayDate] = useState<Date>(() => {
        const storedToday = localStorage.getItem('todoAppToday');
        return storedToday ? new Date(storedToday) : new Date();
    });
    const [dailyTasks, setDailyTasks] = useState<DailyTasks>(() => {
        const storedTasks = localStorage.getItem('todoAppDailyTasks');
        return storedTasks ? JSON.parse(storedTasks) : {};
    });
    const [deletedTasks, setDeletedTasks] = useState<DeletedItem[]>(() => {
        const stored = localStorage.getItem('todoAppDeletedTasks');
        return stored ? JSON.parse(stored) : [];
    });
    const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);

    const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(todayDate));
    const [selectedDate, setSelectedDate] = useState<string>(dateToYMD(todayDate));

    const appContainerRef = useRef<HTMLDivElement>(null);
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            if (localStorage.theme === 'dark') return true;
            if (localStorage.theme === 'light') return false;
        }
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDarkMode]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    useEffect(() => {
        localStorage.setItem('todoAppToday', todayDate.toISOString());
        setCurrentCalendarDate(new Date(todayDate));
        setSelectedDate(dateToYMD(todayDate));
    }, [todayDate]);

    useEffect(() => {
        localStorage.setItem('todoAppDailyTasks', JSON.stringify(dailyTasks));
    }, [dailyTasks]);

    useEffect(() => {
        localStorage.setItem('todoAppDeletedTasks', JSON.stringify(deletedTasks));
    }, [deletedTasks]);

    const getTasksForDate = useCallback((dateString: string): Task[] => {
        if (!dailyTasks[dateString]) {
            const date = new Date(dateString);
            const dayId = DAY_IDS[date.getUTCDay()];
            const defaultTasksForDay = DEFAULT_TASKS[dayId] || [];
            
            const newTasks = defaultTasksForDay.map(task => ({
                id: `task-${Date.now()}-${Math.random()}`,
                text: task.text,
                completed: false
            }));
            
            setTimeout(() => {
              setDailyTasks(prev => ({...prev, [dateString]: newTasks}));
            }, 0);

            return newTasks;
        }
        return dailyTasks[dateString];
    }, [dailyTasks]);

    const updateTasksForDate = (dateString: string, newTasks: Task[]) => {
        setDailyTasks(prev => ({ ...prev, [dateString]: newTasks }));
    };

    const moveTaskToTrash = useCallback((taskId: string, fromDate: string) => {
        setDailyTasks(prev => {
            const newDailyTasks = { ...prev };
            const tasksForDate = newDailyTasks[fromDate] || [];
            const taskToMove = tasksForDate.find(t => t.id === taskId);

            if (taskToMove) {
                setDeletedTasks(prevDeleted => [...prevDeleted, { task: taskToMove, originalDate: fromDate }]);
                newDailyTasks[fromDate] = tasksForDate.filter(t => t.id !== taskId);
            }
            return newDailyTasks;
        });
    }, []);

    const restoreTaskFromTrash = useCallback((itemToRestore: DeletedItem) => {
        setDeletedTasks(prev => prev.filter(item => item.task.id !== itemToRestore.task.id));

        const { task, originalDate } = itemToRestore;
        const restoredTask = { ...task, completed: false };

        setDailyTasks(prev => {
            const newDailyTasks = { ...prev };
            const tasksForDate = newDailyTasks[originalDate] || [];
            newDailyTasks[originalDate] = [...tasksForDate, restoredTask];
            return newDailyTasks;
        });
    }, []);
    
    const handleSetToday = useCallback((dateString: string) => {
        const parts = dateString.split('-');
        const newToday = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        setTodayDate(newToday);
    }, []);

    const goToGraph = () => {
        appContainerRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
    };

    const goToTodo = () => {
        appContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    };
    
    return (
        <div ref={appContainerRef} className="app-container w-full h-full flex overflow-x-auto">
            <TodoView
                todayDate={todayDate}
                getTasksForDate={getTasksForDate}
                updateTasksForDate={updateTasksForDate}
                filterType={filterType}
                setFilterType={setFilterType}
                onSwipeLeft={goToGraph}
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                deletedTasks={deletedTasks}
                onMoveTaskToTrash={moveTaskToTrash}
                onRestoreTask={restoreTaskFromTrash}
            />
            <GraphView
                todayDate={todayDate}
                getTasksForDate={getTasksForDate}
                currentCalendarDate={currentCalendarDate}
                setCurrentCalendarDate={setCurrentCalendarDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onSetToday={handleSetToday}
                onSwipeRight={goToTodo}
            />
        </div>
    );
};

export default App;