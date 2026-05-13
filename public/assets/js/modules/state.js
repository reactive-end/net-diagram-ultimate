/**
 * State module — centralized diagram state management.
 * This is the single source of truth; DOM reflects state, not the reverse.
 */
const DiagramState = (() => {
    let _diagramId = null;
    let _canvasWidth = 1200;
    let _canvasHeight = 800;
    let _dirty = false; // unsaved changes flag

    // Counter for generating unique object IDs
    let _objectIdCounter = Date.now();
    let _lineIdCounter = Date.now() + 1;
    let _noteIdCounter = Date.now() + 2;

    function init(diagramId, width, height) {
        _diagramId = diagramId;
        _canvasWidth = width;
        _canvasHeight = height;
        _dirty = false;
    }

    function getDiagramId() { return _diagramId; }
    function getCanvasWidth() { return _canvasWidth; }
    function getCanvasHeight() { return _canvasHeight; }

    function setCanvasSize(w, h) {
        _canvasWidth = w;
        _canvasHeight = h;
        markDirty();
    }

    function markDirty() { _dirty = true; }
    function markClean() { _dirty = false; }
    function isDirty() { return _dirty; }

    /** Generate a unique object ID */
    function nextObjectId() { return ++_objectIdCounter; }

    /** Generate a unique line ID */
    function nextLineId() { return ++_lineIdCounter; }

    /** Generate a unique note ID */
    function nextNoteId() { return ++_noteIdCounter; }

    /** Collect all objects from the DOM for saving */
    function collectAllObjects() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return [];

        const objects = [];

        // Lines
        canvas.querySelectorAll('.line').forEach(el => {
            objects.push({
                type: 'line',
                lineID: parseInt(el.dataset.id) || 0,
                brotherLine: parseInt(el.dataset.brother) || 0,
                linkedObject: parseInt(el.dataset.linked) || 0,
                parentElement: parseInt(el.dataset.parent) || 0,
                pos_x: parseInt(el.style.left) || 0,
                pos_y: parseInt(el.style.top) || 0,
                line_width: parseFloat(el.style.width) || 0,
                line_angle: parseFloat((el.style.transform || '').replace('rotate(', '').replace('deg)', '')) || 0,
            });
        });

        // Devices
        canvas.querySelectorAll('.object').forEach(el => {
            const type = el.dataset.type;
            const obj = {
                type: type,
                objectID: parseInt(el.dataset.id) || 0,
                pos_x: parseInt(el.style.left) || 0,
                pos_y: parseInt(el.style.top) || 0,
            };

            // Type-specific fields
            switch (type) {
                case 'antenna':
                    obj.name = el.dataset.name || '';
                    obj.ssid = el.dataset.ssid || '';
                    obj.ip = el.dataset.ip || '';
                    obj.frecuency = parseInt(el.dataset.frequency) || 0;
                    obj.mode = parseInt(el.dataset.mode) || 0;
                    obj.band = el.dataset.band || '';
                    obj.apClient = parseInt(el.dataset.apClient) || 0;
                    break;
                case 'router':
                    obj.name = el.dataset.name || '';
                    obj.ip = el.dataset.ip || '';
                    obj.ports = parseInt(el.dataset.ports) || 0;
                    break;
                case 'switch':
                    obj.name = el.dataset.name || '';
                    obj.ip = el.dataset.ip || '';
                    obj.ports = parseInt(el.dataset.ports) || 0;
                    break;
                case 'modem':
                    obj.name = el.dataset.name || '';
                    obj.ip = el.dataset.ip || '';
                    obj.service = el.dataset.service || '';
                    obj.vlan = el.dataset.vlan || '';
                    break;
                case 'computer':
                    obj.name = el.dataset.name || '';
                    obj.ip = el.dataset.ip || '';
                    break;
            }

            objects.push(obj);
        });

        // Notes
        canvas.querySelectorAll('.note').forEach(el => {
            objects.push({
                type: 'note',
                noteID: parseInt(el.dataset.id) || 0,
                text: el.dataset.text || el.textContent || '',
                pos_x: parseInt(el.style.left) || 0,
                pos_y: parseInt(el.style.top) || 0,
            });
        });

        // Boxes
        canvas.querySelectorAll('.node-box').forEach(el => {
            objects.push({
                type: 'box',
                pos_x: parseInt(el.style.left) || 0,
                pos_y: parseInt(el.style.top) || 0,
                box_width: parseInt(el.style.width) || 100,
                box_height: parseInt(el.style.height) || 100,
                color: el.style.backgroundColor || '#e2e8f0',
                border_color: el.style.borderColor || '#94a3b8',
            });
        });

        return objects;
    }

    return {
        init, getDiagramId, getCanvasWidth, getCanvasHeight,
        setCanvasSize, markDirty, markClean, isDirty,
        nextObjectId, nextLineId, nextNoteId,
        collectAllObjects,
    };
})();
