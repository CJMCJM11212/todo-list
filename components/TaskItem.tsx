import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Task, FilterType } from '../types.ts';

interface TaskItemProps {
    task: Task;
    onToggle: (taskId: string) => void;
    onUpdateText: (taskId: string, newText: string) => void;
    onDelete: (taskId: string) => void;
    onDragStart: (task: Task) => void;
    onDragEnter: (task: Task) => void;
    onDragEnd: () => void;
    filterType: FilterType;
    isDarkMode: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onUpdateText, onDelete, onDragStart, onDragEnter, onDragEnd, filterType, isDarkMode }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [isDragging, setIsDragging] = useState(false);
    const clickTimeoutRef = useRef<number | null>(null);

    const handleItemTap = (event: MouseEvent | TouchEvent | PointerEvent) => {
        const target = event.target as HTMLElement;
        // Ignore taps on interactive child elements, as they have their own handlers.
        if (target.closest('.interactive-child')) {
            return;
        }

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            if (!task.completed) {
                setIsEditing(true);
            }
        } else {
            clickTimeoutRef.current = window.setTimeout(() => {
                onToggle(task.id);
                clickTimeoutRef.current = null;
            }, 250);
        }
    };

    const handleUpdate = () => {
        if (editText.trim()) {
            onUpdateText(task.id, editText.trim());
        } else {
            setEditText(task.text);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleUpdate();
        else if (e.key === 'Escape') {
            setEditText(task.text);
            setIsEditing(false);
        }
    };
    
    const handleDragStartInternal = () => {
        if (isEditing) return;
        onDragStart(task);
        setIsDragging(true);
    };
    
    const handleDragEndInternal = () => {
        onDragEnd();
        setIsDragging(false);
    };

    const variants: Variants = {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
        exit: { x: -100, opacity: 0, transition: { duration: 0.2 } },
        exitSpecial: {
            backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.7)' : 'rgba(134, 239, 172, 1)',
            x: 30,
            opacity: 0,
            transition: { duration: 0.4 }
        }
    };

    const trashIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
    
    return (
        <motion.li
            id={task.id}
            layout
            initial="initial"
            animate="animate"
            exit={(filterType === FilterType.ONE || filterType === FilterType.REMAINING) && task.completed ? "exitSpecial" : "exit"}
            variants={variants}
            className="mb-2"
            draggable={!isEditing}
            onDragStart={handleDragStartInternal}
            onDragEnter={() => onDragEnter(task)}
            onDragEnd={handleDragEndInternal}
            onDragOver={(e) => e.preventDefault()}
        >
            <motion.div
                className={`task flex items-center p-3 bg-white dark:bg-slate-700 rounded-lg shadow-xs w-full ${isDragging ? 'dragging' : ''}`}
                whileHover={{ scale: 1.02 }}
                onTap={handleItemTap}
            >
                <motion.div className="interactive-child cursor-pointer" whileTap={{ scale: 0.9 }} onTap={() => onToggle(task.id)}>
                    <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="task-checkbox h-5 w-5 rounded text-indigo-600 flex-shrink-0 bg-gray-100 border-gray-300 dark:bg-slate-600 dark:border-slate-500 focus:ring-indigo-500 dark:focus:ring-indigo-600 pointer-events-none"
                    />
                </motion.div>
                {isEditing ? (
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleUpdate}
                        onKeyDown={handleKeyDown}
                        className="interactive-child flex-grow ml-3 text-sm bg-transparent border border-indigo-500 rounded px-1 py-0.5"
                        autoFocus
                    />
                ) : (
                    <span
                        className={`relative flex-grow ml-3 text-sm break-all transition-colors duration-300 ${task.completed ? 'text-gray-400 dark:text-slate-500' : ''}`}
                    >
                        {task.text}
                        <AnimatePresence>
                            {task.completed && (
                                <motion.div
                                    className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current origin-left"
                                    style={{ y: "-1px" }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    exit={{ scaleX: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </AnimatePresence>
                    </span>
                )}
                <motion.button
                    onTap={() => onDelete(task.id)}
                    whileTap={{ scale: 0.9 }}
                    className="interactive-child ml-2 p-1 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 flex-shrink-0"
                    aria-label={`'${task.text}' 할 일 삭제`}
                >
                    {trashIcon}
                </motion.button>
            </motion.div>
        </motion.li>
    );
};

export default TaskItem;