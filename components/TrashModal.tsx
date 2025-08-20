import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { DeletedItem } from '../types';

interface TrashModalProps {
    isOpen: boolean;
    onClose: () => void;
    deletedTasks: DeletedItem[];
    onRestoreTask: (item: DeletedItem) => void;
}

const backdropVariants: Variants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
};

const modalVariants: Variants = {
    hidden: { y: "100vh", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { y: "100vh", opacity: 0, transition: { duration: 0.3 } },
};

const restoreIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);


const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose, deletedTasks, onRestoreTask }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 z-40 flex justify-center items-end"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        className="bg-white dark:bg-slate-800 w-full max-w-2xl h-[85vh] rounded-t-2xl flex flex-col"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold">휴지통</h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="닫기">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </header>
                        <div className="flex-grow overflow-y-auto p-4">
                            {deletedTasks.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-slate-400 h-full flex items-center justify-center">
                                    <p>휴지통이 비어 있습니다.</p>
                                </div>
                            ) : (
                                <ul>
                                    <AnimatePresence>
                                    {deletedTasks.map((item) => (
                                        <motion.li 
                                            key={item.task.id} 
                                            className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                        >
                                            <div>
                                                <p className="text-gray-800 dark:text-slate-200">{item.task.text}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">원래 위치: {item.originalDate}</p>
                                            </div>
                                            <button 
                                                onClick={() => onRestoreTask(item)}
                                                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-700/50 transition-colors"
                                                aria-label={`'${item.task.text}' 복구`}
                                            >
                                                <span>복구</span>
                                                {restoreIcon}
                                            </button>
                                        </motion.li>
                                    ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TrashModal;