import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('should return initial value when localStorage is empty', async () => {
        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'initialValue')
        );

        // Wait for useEffect to run
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current[0]).toBe('initialValue');
    });

    it('should return stored value from localStorage', async () => {
        localStorage.setItem('testKey', JSON.stringify('storedValue'));

        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'initialValue')
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current[0]).toBe('storedValue');
    });

    it('should update localStorage when setValue is called', async () => {
        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'initialValue')
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current[1]('newValue');
        });

        expect(localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'));
        expect(result.current[0]).toBe('newValue');
    });

    it('should handle function updates', async () => {
        const { result } = renderHook(() =>
            useLocalStorage('testKey', 10)
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current[1]((prev) => (prev as number) + 5);
        });

        expect(result.current[0]).toBe(15);
        expect(localStorage.getItem('testKey')).toBe(JSON.stringify(15));
    });

    it('should work with different types', async () => {
        // Number
        const { result: numberResult } = renderHook(() =>
            useLocalStorage('numberKey', 42)
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(numberResult.current[0]).toBe(42);

        // Boolean
        const { result: boolResult } = renderHook(() =>
            useLocalStorage('boolKey', true)
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(boolResult.current[0]).toBe(true);

        // String
        const { result: stringResult } = renderHook(() =>
            useLocalStorage('stringKey', 'test')
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(stringResult.current[0]).toBe('test');
    });


    it('should handle invalid JSON in localStorage', async () => {
        // Mock console.warn to avoid noise in test output
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        localStorage.setItem('testKey', 'invalid json {');

        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'fallback')
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Should fall back to initial value on parse error
        expect(result.current[0]).toBe('fallback');
        expect(consoleWarnSpy).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
    });

    it('should update when key changes', async () => {
        localStorage.setItem('key1', JSON.stringify('value1'));
        localStorage.setItem('key2', JSON.stringify('value2'));

        const { result, rerender } = renderHook(
            ({ key }) => useLocalStorage(key, 'default'),
            { initialProps: { key: 'key1' } }
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current[0]).toBe('value1');

        rerender({ key: 'key2' });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current[0]).toBe('value2');
    });

    it('should handle undefined values correctly', async () => {
        localStorage.setItem('testKey', 'undefined');

        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'default')
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // parseJSON should return undefined for 'undefined' string
        expect(result.current[0]).toBe('default');
    });
});
