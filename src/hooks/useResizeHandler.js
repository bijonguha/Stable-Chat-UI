import { useEffect } from 'react';

const useResizeHandler = (containerRef) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeHandle = container.querySelector('.resize-handle');
        if (!resizeHandle) return;

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        const handleMouseDown = (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(container).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(container).height, 10);

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            container.style.transition = 'none';

            e.preventDefault();
        };

        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const width = startWidth + (startX - e.clientX);
            const height = startHeight + (startY - e.clientY);

            // Apply constraints
            const minWidth = 300;
            const maxWidth = 800;
            const minHeight = 400;
            const maxHeight = window.innerHeight * 0.9;

            const constrainedWidth = Math.min(Math.max(width, minWidth), maxWidth);
            const constrainedHeight = Math.min(Math.max(height, minHeight), maxHeight);

            container.style.width = constrainedWidth + 'px';
            container.style.height = constrainedHeight + 'px';
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Restore text selection and transitions
            document.body.style.userSelect = '';
            container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        };

        resizeHandle.addEventListener('mousedown', handleMouseDown);

        return () => {
            resizeHandle.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [containerRef]);
};

export default useResizeHandler;