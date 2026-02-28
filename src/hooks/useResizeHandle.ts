import { useEffect, type RefObject } from 'react';

export function useResizeHandle(
  containerRef: RefObject<HTMLDivElement | null>,
  handleRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const container = containerRef.current;
    const handle = handleRef.current;
    if (!container || !handle) return;

    // Disable on mobile
    if (window.innerWidth <= 768) return;

    let isResizing = false;

    const onMouseDown = (e: MouseEvent) => {
      isResizing = true;
      document.body.style.userSelect = 'none';
      const startWidth = container.offsetWidth;
      const startHeight = container.offsetHeight;
      const startX = e.clientX;
      const startY = e.clientY;

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        const width = startWidth + (startX - e.clientX);
        const height = startHeight + (startY - e.clientY);
        container.style.width = `${Math.max(300, Math.min(800, width))}px`;
        container.style.height = `${Math.max(400, height)}px`;
      };

      const onMouseUp = () => {
        isResizing = false;
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }, [containerRef, handleRef]);
}
