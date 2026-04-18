/**
 * Shared Form Input Styles
 * Reusable Tailwind CSS classes for consistent form styling across all components
 * Follows design system principles: uniform spacing, focus states, and transitions
 * 
 * Usage: Import and apply to form elements
 * @example
 * import { INPUT_CLASS, LABEL_CLASS, BUTTON_PRIMARY } from '@/styles/formInputs'
 * <label className={LABEL_CLASS}>Email</label>
 * <input className={INPUT_CLASS} type="email" />
 * <button className={BUTTON_PRIMARY}>Submit</button>
 */

// Base input styling: border, padding, text size, transitions
export const INPUT_BASE = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-normal transition-colors';

// Focus state: blue ring and border highlight for accessibility
export const INPUT_FOCUS = 'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400';

// Combined input class for all text inputs
export const INPUT_CLASS = `${INPUT_BASE} ${INPUT_FOCUS}`;

// Textarea styling: same as input but with resize disabled
export const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`;

// Select/dropdown styling: matches input styling
export const SELECT_CLASS = `${INPUT_CLASS}`;

// Label styling: consistent font, spacing, color
export const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';

// Primary action button: indigo background, full width, hover effect
export const BUTTON_PRIMARY = 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

// Secondary button: outline style for less prominent actions
export const BUTTON_SECONDARY = 'px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors';

// Icon button: flex layout for icon + text combinations
export const BUTTON_ICON = 'flex items-center justify-center gap-2';
