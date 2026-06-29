'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'seenly-dashboard-preview';
const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 300;

interface PreviewPrefs {
  width: number;
  open: boolean;
}

function loadPrefs(): PreviewPrefs {
  if (typeof window === 'undefined') return { width: DEFAULT_WIDTH, open: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { width: DEFAULT_WIDTH, open: true };
    const parsed = JSON.parse(raw) as Partial<PreviewPrefs>;
    return {
      width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width ?? DEFAULT_WIDTH)),
      open: parsed.open ?? true,
    };
  } catch {
    return { width: DEFAULT_WIDTH, open: true };
  }
}

export function useDashboardPreview() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [open, setOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    const prefs = loadPrefs();
    setWidth(prefs.width);
    setOpen(prefs.open);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ width, open }));
  }, [width, open]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
      setIsDragging(true);
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setWidth(next);
    };

    const onUp = () => setIsDragging(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return { width, open, toggle, onResizeStart, isDragging, MIN_WIDTH, MAX_WIDTH };
}
