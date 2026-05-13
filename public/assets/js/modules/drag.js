/**
 * Drag module - drag & drop for objects, notes, and line updates.
 * Supports mouse (desktop) and touch (mobile).
 */
const DragSystem = (() => {
    const H = DOMHelpers;
    let dragging = null;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    // Touch-specific: track whether a touchmove happened to distinguish tap vs drag
    let touchDragging = null;
    let touchMoved = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchOrigLeft = 0;
    let touchOrigTop = 0;
    const DRAG_THRESHOLD = 5; // px

    function init() {
        const canvas = H.$('canvas');
        if (!canvas) return;

        // Mouse events (desktop)
        canvas.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Touch events (mobile) — use passive:false so we can prevent scroll during drag
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
    }

    // ── Mouse handlers (unchanged desktop behavior) ────────────────
    function onMouseDown(e) {
        if (e.button !== 0) return;

        const target = e.target.closest('.object, .note');
        if (!target) return;
        if (e.target.closest('.line') || e.target.closest('.node-box')) return;

        dragging = target;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = parseInt(target.style.left) || 0;
        origTop = parseInt(target.style.top) || 0;

        target.style.zIndex = '50';
        target.style.transition = 'none';
        e.preventDefault();
    }

    function onMouseMove(e) {
        if (!dragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        dragging.style.left = (origLeft + dx) + 'px';
        dragging.style.top = (origTop + dy) + 'px';

        updateConnectedLines(dragging);
        DiagramState.markDirty();
    }

    function onMouseUp(e) {
        if (!dragging) return;

        dragging.style.zIndex = '10';
        dragging.style.transition = '';
        updateConnectedLines(dragging);
        dragging = null;
    }

    // ── Touch handlers (mobile tap → context menu, drag → move) ────
    function onTouchStart(e) {
        // Touch drag disabled on mobile — only tap→context menu is allowed
        // Let the event bubble so the click handler in editor.js can fire
    }

    function onTouchMove(e) {
        if (!touchDragging) return;

        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        // Only start a drag after crossing the threshold
        if (!touchMoved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
            return;
        }

        if (!touchMoved) {
            touchMoved = true;
            touchDragging.style.zIndex = '50';
            touchDragging.style.transition = 'none';
        }

        touchDragging.style.left = (touchOrigLeft + dx) + 'px';
        touchDragging.style.top = (touchOrigTop + dy) + 'px';

        updateConnectedLines(touchDragging);
        DiagramState.markDirty();

        // Prevent page scrolling while actively dragging
        e.preventDefault();
    }

    function onTouchEnd(e) {
        if (!touchDragging) return;

        if (touchMoved) {
            touchDragging.style.zIndex = '10';
            touchDragging.style.transition = '';
            updateConnectedLines(touchDragging);
            // Prevent the synthetic click that fires after a drag
            e.preventDefault();
        }
        // If !touchMoved, it was a tap — the subsequent click event will show context menu

        touchDragging = null;
        touchMoved = false;
    }

    /**
     * Update all lines connected to the dragged element.
     */
    function updateConnectedLines(el) {
        const canvas = H.$('canvas');
        if (!canvas) return;

        const isObject = el.classList.contains('object');
        const objId = parseInt(el.dataset.id);

        if (!isObject || !objId) return;

        const lines = canvas.querySelectorAll('.line');

        lines.forEach(line => {
            const parentId = parseInt(line.dataset.parent);
            const linkedId = parseInt(line.dataset.linked);

            if (parentId === objId) {
                const targetEl = findObjectById(linkedId);
                if (targetEl) {
                    const from = H.getCenter(el);
                    const to = H.getCenter(targetEl);
                    updateLinePosition(line, from.x, from.y, to.x, to.y);
                }
            } else if (linkedId === objId) {
                const sourceEl = findObjectById(parentId);
                if (sourceEl) {
                    const from = H.getCenter(sourceEl);
                    const to = H.getCenter(el);
                    updateLinePosition(line, from.x, from.y, to.x, to.y);
                }
            }
        });
    }

    function updateLinePosition(line, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.left = x1 + 'px';
        line.style.top = y1 + 'px';
        line.style.width = length + 'px';
        line.style.transform = 'rotate(' + angle + 'deg)';
    }

    function findObjectById(id) {
        const canvas = H.$('canvas');
        if (!canvas) return null;
        return canvas.querySelector('.object[data-id="' + id + '"]');
    }

    return { init, updateConnectedLines };
})();
