// Reusable form input classes
export const INPUT_BASE = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-normal transition-colors';
export const INPUT_FOCUS = 'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400';
export const INPUT_CLASS = `${INPUT_BASE} ${INPUT_FOCUS}`;

export const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`;

export const SELECT_CLASS = `${INPUT_CLASS}`;

export const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';

export const BUTTON_PRIMARY = 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
export const BUTTON_SECONDARY = 'px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors';
export const BUTTON_ICON = 'flex items-center justify-center gap-2';
