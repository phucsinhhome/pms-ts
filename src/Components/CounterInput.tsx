import React from 'react';

// T is the shape of your data object (e.g., RatePlan)
// K is the specific key you want to update
interface CounterInputProps<T> {
    label?: string;
    name: keyof T;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (name: keyof T, newValue: number) => void;
}

const CounterInput = <T,>({
    label,
    name,
    value = 0,
    min = 0,
    max = 9999999999999,
    step = 1,
    onChange,
}: CounterInputProps<T>) => {

    const handleDecrement = () => {
        if (value > min) {
            onChange(name, value - step);
        }
    };

    const handleIncrement = () => {
        if (value < max) {
            onChange(name, value + step);
        }
    };

    return (
        <div className="flex flex-row gap-2">
            {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
            <div className="relative flex w-full items-center">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    className="h-9 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                >
                    <svg className="h-3 w-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                    </svg>
                </button>

                <input
                    type="number"
                    className="block h-9 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    value={value}
                    readOnly
                />

                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    className="h-9 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                >
                    <svg className="h-3 w-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CounterInput;