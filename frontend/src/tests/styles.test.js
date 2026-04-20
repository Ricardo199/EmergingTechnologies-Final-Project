import { describe, test, expect } from 'vitest';
import { STATUS_COLORS, PRIORITY_COLORS, ALERT_COLORS, STAT_COLORS } from '../styles/colors.js';
import {
  INPUT_CLASS, TEXTAREA_CLASS, SELECT_CLASS,
  LABEL_CLASS, BUTTON_PRIMARY, BUTTON_SECONDARY,
} from '../styles/formInputs.js';

describe('STATUS_COLORS', () => {
  test('has all expected statuses', () => {
    ['reported', 'in_progress', 'resolved', 'closed'].forEach(s => {
      expect(STATUS_COLORS[s]).toBeTruthy();
    });
  });
});

describe('PRIORITY_COLORS', () => {
  test('has all priority levels', () => {
    ['low', 'medium', 'high'].forEach(p => {
      expect(PRIORITY_COLORS[p]).toBeTruthy();
    });
  });
});

describe('ALERT_COLORS', () => {
  test('has all alert types', () => {
    ['success', 'error', 'info', 'warning'].forEach(t => {
      expect(ALERT_COLORS[t]).toBeTruthy();
    });
  });
});

describe('STAT_COLORS', () => {
  test('has open, resolved, high keys', () => {
    expect(STAT_COLORS.open).toBeTruthy();
    expect(STAT_COLORS.resolved).toBeTruthy();
    expect(STAT_COLORS.high).toBeTruthy();
  });
});

describe('formInputs', () => {
  test('INPUT_CLASS is a non-empty string', () => {
    expect(typeof INPUT_CLASS).toBe('string');
    expect(INPUT_CLASS.length).toBeGreaterThan(0);
  });

  test('TEXTAREA_CLASS includes INPUT_CLASS', () => {
    expect(TEXTAREA_CLASS).toContain(INPUT_CLASS);
  });

  test('SELECT_CLASS equals INPUT_CLASS', () => {
    expect(SELECT_CLASS).toBe(INPUT_CLASS);
  });

  test('LABEL_CLASS is a non-empty string', () => {
    expect(typeof LABEL_CLASS).toBe('string');
    expect(LABEL_CLASS.length).toBeGreaterThan(0);
  });

  test('BUTTON_PRIMARY contains indigo', () => {
    expect(BUTTON_PRIMARY).toMatch(/indigo/);
  });

  test('BUTTON_SECONDARY is a non-empty string', () => {
    expect(typeof BUTTON_SECONDARY).toBe('string');
    expect(BUTTON_SECONDARY.length).toBeGreaterThan(0);
  });
});
