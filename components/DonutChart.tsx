import React from 'react';

interface DonutChartProps {
    percentage: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ percentage }) => {
    const offset = 100 - percentage;
    let strokeColor = '#d1d5db';
    if (percentage > 20) strokeColor = '#facc15';
    if (percentage > 50) strokeColor = '#fb923c';
    if (percentage >= 70) strokeColor = '#22c55e';

    return (
        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="donut-chart-bg"
                    strokeWidth="3.8"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                ></path>
                <path
                    className="donut-chart-fg"
                    strokeWidth="3.8"
                    strokeDasharray="100, 100"
                    strokeDashoffset={offset}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ stroke: strokeColor }}
                ></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-800 dark:text-slate-100">
                {percentage}%
            </div>
        </div>
    );
};

export default DonutChart;