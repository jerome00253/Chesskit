import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'first', delay: 500 } }
        );

        expect(result.current).toBe('first');

        // Change value
        rerender({ value: 'second', delay: 500 });

        // Value should not change immediately
        expect(result.current).toBe('first');

        // Fast-forward time
        act(() => {
            jest.advanceTimersByTime(500);
        });

        // Now value should be updated
        expect(result.current).toBe('second');
    });

    it('should cancel previous timeout on rapid changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'first', delay: 500 } }
        );

        // Rapid changes
        rerender({ value: 'second', delay: 500 });
        act(() => {
            jest.advanceTimersByTime(200);
        });

        rerender({ value: 'third', delay: 500 });
        act(() => {
            jest.advanceTimersByTime(200);
        });

        rerender({ value: 'fourth', delay: 500 });

        // Only 400ms passed, should still be 'first'
        expect(result.current).toBe('first');

        // Complete the debounce
        act(() => {
            jest.advanceTimersByTime(500);
        });

        // Should jump to the last value
        expect(result.current).toBe('fourth');
    });

    it('should handle different delay values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'first', delay: 1000 } }
        );

        rerender({ value: 'second', delay: 1000 });

        act(() => {
            jest.advanceTimersByTime(500);
        });
        expect(result.current).toBe('first');

        act(() => {
            jest.advanceTimersByTime(500);
        });
        expect(result.current).toBe('second');
    });

    it('should immediately update when debouncedValue is falsy', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: '', delay: 500 } }
        );

        expect(result.current).toBe('');

        // First real value should update immediately
        rerender({ value: 'first', delay: 500 });
        expect(result.current).toBe('first');
    });

    it('should work with different types', () => {
        const { result: numberResult } = renderHook(() => useDebounce(42, 500));
        expect(numberResult.current).toBe(42);

        const { result: boolResult } = renderHook(() => useDebounce(true, 500));
        expect(boolResult.current).toBe(true);

        const { result: objectResult } = renderHook(() =>
            useDebounce({ key: 'value' }, 500)
        );
        expect(objectResult.current).toEqual({ key: 'value' });
    });
});
