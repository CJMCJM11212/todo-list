import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Task, FilterType } from '../types';
import { WEEK_DAY_NAMES } from '../constants';
import TaskItem from './TaskItem';
import Confetti from './Confetti';

interface DayColumnProps {
    date: Date;
    isToday: boolean;
    tasks: Task[];
    updateTasks: (newTasks: Task[]) => void;
    onDelete: (taskId: string) => void;
    filterType: FilterType;
    isDarkMode: boolean;
}

const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
        },
    },
};

const completionMessageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const DayColumn: React.FC<DayColumnProps> = ({ date, isToday, tasks, updateTasks, onDelete, filterType, isDarkMode }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const draggedItem = useRef<Task | null>(null);
    const dragOverItem = useRef<Task | null>(null);

    const dateString = useMemo(() => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }, [date]);

    useEffect(() => {
        if (completingTaskId) {
            const timer = setTimeout(() => {
                setCompletingTaskId(null);
            }, 400); // Wait for strikethrough animation to play
            return () => clearTimeout(timer);
        }
    }, [completingTaskId]);

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTaskText.trim() !== '') {
            const newTask: Task = {
                id: `task-${Date.now()}-${Math.random()}`,
                text: newTaskText.trim(),
                completed: false,
            };
            updateTasks([...tasks, newTask]);
            setNewTaskText('');
        }
    };
    
    const handleToggleTask = (taskId: string) => {
        const taskToComplete = tasks.find(t => t.id === taskId && !t.completed);

        const newTasks = tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        updateTasks(newTasks);

        if ((filterType === FilterType.ONE || filterType === FilterType.REMAINING) && taskToComplete) {
            setCompletingTaskId(taskId);
        }

        const allCompleted = newTasks.length > 0 && newTasks.every(t => t.completed);
        if(allCompleted) {
            setShowConfetti(true);
        }
    };

    const handleUpdateTaskText = (taskId: string, newText: string) => {
        updateTasks(tasks.map(task => 
            task.id === taskId ? { ...task, text: newText } : task
        ));
    };

    const handleDeleteTask = (taskId: string) => {
        onDelete(taskId);
    };

    const handleDragStart = (task: Task) => {
        draggedItem.current = task;
    };

    const handleDragEnter = (task: Task) => {
        dragOverItem.current = task;
    };

    const handleDragEnd = () => {
        if (!draggedItem.current || !dragOverItem.current || draggedItem.current.id === dragOverItem.current.id) {
            draggedItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newTasks = [...tasks];
        const draggedIndex = tasks.findIndex(t => t.id === draggedItem.current!.id);
        const targetIndex = tasks.findIndex(t => t.id === dragOverItem.current!.id);

        newTasks.splice(draggedIndex, 1);
        newTasks.splice(targetIndex, 0, draggedItem.current);

        updateTasks(newTasks);
        
        draggedItem.current = null;
        dragOverItem.current = null;
    };

    const filteredTasks = useMemo(() => {
        if (filterType === FilterType.ONE) {
            if (completingTaskId) {
                const completingTask = tasks.find(t => t.id === completingTaskId);
                return completingTask ? [completingTask] : [];
            }
            const remaining = tasks.filter(t => !t.completed);
            return remaining.length > 0 ? remaining.slice(0, 1) : [];
        }

        if (filterType === FilterType.REMAINING) {
            if (completingTaskId) {
                // Show tasks that are not completed, OR the task that is currently animating out.
                return tasks.filter(t => !t.completed || t.id === completingTaskId);
            }
            return tasks.filter(t => !t.completed);
        }
        
        // FilterType.ALL
        return tasks;
    }, [tasks, filterType, completingTaskId]);

    const headerClass = `font-bold text-xl text-center ${isToday ? 'text-indigo-600 dark:text-indigo-400' : ''}`;
    const dayName = WEEK_DAY_NAMES[date.getDay()];

    return (
        <div className="day-scroll-item w-full h-full p-2 sm:p-4 box-border">
            {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl shadow-sm w-full h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className={headerClass}>{dayName}요일 ({date.getMonth() + 1}/{date.getDate()})</h2>
                </div>
                <motion.ul
                    layout
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="task-list p-2 flex-grow overflow-y-auto"
                >
                    <AnimatePresence>
                        {filterType === FilterType.ONE && tasks.length > 0 && tasks.every(t => t.completed) && !completingTaskId && (
                            <motion.li
                                layout
                                variants={completionMessageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="completion-message text-center p-8 flex flex-col items-center justify-center h-full"
                            >
                                <motion.div className="text-5xl mb-4" animate={{ rotate: [0, 20, -20, 0], transition: { repeat: Infinity, duration: 1 }}}>🎉</motion.div>
                                <h3 className="font-bold text-xl text-green-600">대단합니다!</h3>
                                <p className="text-gray-600 dark:text-slate-300 mt-2">오늘 할 일을 모두 완료했습니다.</p>
                            </motion.li>
                        )}
                        {filteredTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={handleToggleTask}
                                onUpdateText={handleUpdateTaskText}
                                onDelete={handleDeleteTask}
                                onDragStart={handleDragStart}
                                onDragEnter={handleDragEnter}
                                onDragEnd={handleDragEnd}
                                filterType={filterType}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </AnimatePresence>
                </motion.ul>
                <div className="p-2 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyPress={handleAddTask}
                        className="new-task-input w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
                        placeholder="새 할 일 추가 (Enter)"
                    />
                </div>
            </div>
        </div>
    );
};

export default DayColumn;