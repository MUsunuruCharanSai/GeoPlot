import { useCallback, useState } from 'react';

/**
 * Simple undo/redo stack for boundary point arrays.
 */
export default function useMeasurementHistory(initialPoints = []) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialPoints);
  const [future, setFuture] = useState([]);

  const setPoints = useCallback((updater, { record = true } = {}) => {
    setPresent((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (record) {
        setPast((p) => [...p, current]);
        setFuture([]);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setPresent((current) => {
        setFuture((f) => [current, ...f]);
        return previous;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPresent((current) => {
        setPast((p) => [...p, current]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  const reset = useCallback((points = []) => {
    setPast([]);
    setPresent(points);
    setFuture([]);
  }, []);

  return {
    points: present,
    setPoints,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
