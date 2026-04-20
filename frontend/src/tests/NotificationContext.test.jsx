import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from '../context/NotificationContext.jsx';

describe('NotificationContext', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const wrapper = ({ children }) => <NotificationProvider>{children}</NotificationProvider>;

  test('starts with no notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    expect(result.current.notifications).toHaveLength(0);
  });

  test('showNotification adds a notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => { result.current.showNotification('Hello', 'success'); });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Hello');
    expect(result.current.notifications[0].type).toBe('success');
  });

  test('notification auto-dismisses after duration', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => { result.current.showNotification('Temp', 'info', 1000); });
    expect(result.current.notifications).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.notifications).toHaveLength(0);
  });

  test('notification does not auto-dismiss when duration is 0', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => { result.current.showNotification('Sticky', 'warning', 0); });
    act(() => { vi.advanceTimersByTime(10000); });
    expect(result.current.notifications).toHaveLength(1);
  });

  test('dismissNotification removes by id', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    let id;
    act(() => { id = result.current.showNotification('Dismiss me', 'error', 0); });
    expect(result.current.notifications).toHaveLength(1);
    act(() => { result.current.dismissNotification(id); });
    expect(result.current.notifications).toHaveLength(0);
  });

  test('multiple notifications stack', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => {
      result.current.showNotification('First', 'info', 0);
      result.current.showNotification('Second', 'success', 0);
    });
    expect(result.current.notifications).toHaveLength(2);
  });

  test('useNotification throws outside provider', () => {
    expect(() => renderHook(() => useNotification())).toThrow(
      'useNotification must be used within NotificationProvider'
    );
  });
});
