import { useState, useCallback, useRef } from 'react';

export interface HistoryControls<T> {
  state: T;
  set: (value: T | ((val: T) => T), skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: T[]; // Exposed for debugging or specific logic
}

export function useHistory<T>(initialState: T, maxHistory: number = 50): HistoryControls<T> {
  const [state, _setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // Ref to track the last state pushed to history to avoid duplicates
  const lastHistoryState = useRef<T>(initialState);

  const set = useCallback((newValue: T | ((val: T) => T), skipHistory: boolean = false) => {
    _setState((currentState) => {
      const computedValue = newValue instanceof Function ? newValue(currentState) : newValue;

      if (computedValue === currentState) return currentState;

      if (!skipHistory) {
        setPast((prev) => {
          const newPast = [...prev, currentState];
          if (newPast.length > maxHistory) return newPast.slice(newPast.length - maxHistory);
          return newPast;
        });
        setFuture([]);
        lastHistoryState.current = computedValue;
      }
      
      return computedValue;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      _setState((current) => {
        setFuture((prevFuture) => [current, ...prevFuture]);
        return previous;
      });
      
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      _setState((current) => {
        setPast((prevPast) => [...prevPast, current]);
        return next;
      });

      return newFuture;
    });
  }, []);

  return { state, set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, history: past };
}
