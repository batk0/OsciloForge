import { getMousePos } from './utils.js';

export class MouseHandler {
    constructor(canvas, state, hooks) {
        this.canvas = canvas;
        this.state = state;
        this.hooks = hooks;

        this.isDrawing = false;
        this.lastPoint = { x: -1, y: -1 };
        this.lineStartPoint = null;

        // Mouse pan/zoom state
        this.isPanning = false;
        this.isZooming = false;
        this.zoomDirection = 'none';
        this.dragStartPos = { x: 0, y: 0 };
        this.dragStartHOffset = 0;
        this.dragStartVOffset = 0;
        this.dragStartHZoom = 1;
        this.dragStartVZoom = 1;
        
        this.WAVEFORM_POINTS = state.WAVEFORM_POINTS;
        this.TOP_PADDING = state.TOP_PADDING;
        this.RIGHT_PADDING = state.RIGHT_PADDING;
        this.BOTTOM_PADDING = state.BOTTOM_PADDING;
        this.LEFT_PADDING = state.LEFT_PADDING;

        this.init();
    }

    init() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }

    handleMouseDown(e) {
        if (e.shiftKey) {
            this.isPanning = true;
            this.dragStartPos = getMousePos(e, this.canvas);
            this.dragStartHOffset = this.state.viewOffset;
            this.dragStartVOffset = this.state.vShift;
            e.preventDefault();
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        if (e.metaKey || e.ctrlKey) {
            this.isZooming = true;
            this.zoomDirection = 'none';
            this.dragStartPos = getMousePos(e, this.canvas);
            this.dragStartHZoom = this.state.hZoom;
            this.dragStartVZoom = this.state.vZoom;
            e.preventDefault();
            this.canvas.style.cursor = 'nwse-resize';
            return;
        }

        if (e.button !== 0) return;
        const chartWidth = this.canvas.width - (this.LEFT_PADDING + this.RIGHT_PADDING);
        const mousePos = getMousePos(e, this.canvas);
        if (mousePos.x < this.LEFT_PADDING || mousePos.x > this.LEFT_PADDING + chartWidth) {
            return;
        }

        if (this.state.editMode === 'freehand') {
            this.isDrawing = true;
            this.handleFreehandDraw(e);
        } else if (this.state.editMode === 'line') {
            this.handleLineDraw(e);
        }
    }

    handleMouseUp() {
        if (this.isPanning || this.isZooming) {
            this.endDrag();
        }
        if (this.state.editMode === 'freehand') {
            this.isDrawing = false;
            this.lastPoint = { x: -1, y: -1 };
        }
    }

    handleMouseLeave() {
        if (this.isPanning || this.isZooming) {
            this.endDrag();
        }
        if (this.state.editMode === 'freehand') {
            this.isDrawing = false;
            this.lastPoint = { x: -1, y: -1 };
        }
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            const currentPos = getMousePos(e, this.canvas);
            const deltaX = currentPos.x - this.dragStartPos.x;
            const deltaY = currentPos.y - this.dragStartPos.y;
    
            const chartWidth = this.canvas.clientWidth - (this.LEFT_PADDING + this.RIGHT_PADDING);
            const pointsPerPixel = (this.WAVEFORM_POINTS / this.state.hZoom) / chartWidth;
            const hOffsetChange = deltaX * pointsPerPixel;
            
            const newViewOffset = this.dragStartHOffset - hOffsetChange;
            this.hooks.updateState({ viewOffset: newViewOffset });
    
            const newVShift = this.dragStartVOffset + deltaY;
            this.hooks.updateState({ vShift: newVShift });
            
            this.hooks.draw();
            return;
        }

        if (this.isZooming) {
            const currentPos = getMousePos(e, this.canvas);
            const deltaX = currentPos.x - this.dragStartPos.x;
            const deltaY = currentPos.y - this.dragStartPos.y;

            if (this.zoomDirection === 'none' && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                this.zoomDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
            }

            if (this.zoomDirection === 'horizontal') {
                this.canvas.style.cursor = 'ew-resize';
                const zoomFactor = Math.pow(2, -deltaX / 200);
                let newHZoom = this.dragStartHZoom * zoomFactor;
                this.hooks.updateZoom('h', newHZoom);
            } else if (this.zoomDirection === 'vertical') {
                this.canvas.style.cursor = 'ns-resize';
                const zoomFactor = Math.pow(2, -deltaY / 200);
                let newVZoom = this.dragStartVZoom * zoomFactor;
                this.hooks.updateZoom('v', newVZoom);
            } else {
                this.hooks.draw();
            }
            return;
        }

        if (this.state.editMode === 'freehand') {
            this.handleFreehandDraw(e);
        }
    }
    
    handleContextMenu(e) {
        if (this.state.editMode === 'line') {
            e.preventDefault();
            this.lineStartPoint = null;
        }
    }

    endDrag() {
        this.isPanning = false;
        this.isZooming = false;
        this.zoomDirection = 'none';
        this.canvas.style.cursor = 'crosshair';
    }

    handleFreehandDraw(event) {
        if (!this.isDrawing) return;
        
        const chartWidth = this.canvas.width - (this.LEFT_PADDING + this.RIGHT_PADDING);
        const chartHeight = this.canvas.height - (this.TOP_PADDING + this.BOTTOM_PADDING);
        const mousePos = getMousePos(event, this.canvas);

        const visiblePoints = this.WAVEFORM_POINTS / this.state.hZoom;
        const localXScale = chartWidth / visiblePoints;
        
        const dataIndexFloat = (mousePos.x - this.LEFT_PADDING) / localXScale + this.state.viewOffset;
        const currentPointX = Math.floor(dataIndexFloat);

        if (currentPointX >= 0 && currentPointX < this.WAVEFORM_POINTS) {
            const vCenter = chartHeight / 2 + this.state.vShift;
            const vScale = (chartHeight / 2) * this.state.vZoom;
            let value = (vCenter - (mousePos.y - this.TOP_PADDING)) / vScale;
            value = Math.max(-1.0, Math.min(1.0, value));

            if (this.lastPoint.x !== -1 && this.lastPoint.x !== currentPointX) {
                const startX = Math.min(this.lastPoint.x, currentPointX);
                const endX = Math.max(this.lastPoint.x, currentPointX);
                const startY = (this.lastPoint.x < currentPointX) ? this.lastPoint.y : value;
                const endY = (this.lastPoint.x < currentPointX) ? value : lastPoint.y;
                for (let i = startX; i <= endX; i++) {
                    if (i >= 0 && i < this.state.waveformData.length) {
                       const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
                       this.state.waveformData[i] = startY + t * (endY - startY);
                    }
                }
            } else {
                 if (currentPointX >= 0 && currentPointX < this.state.waveformData.length) {
                    this.state.waveformData[currentPointX] = value;
                }
            }
            
            this.lastPoint = { x: currentPointX, y: value };
            this.hooks.draw();
        }
    }

    handleLineDraw(event) {
        const chartWidth = this.canvas.width - (this.LEFT_PADDING + this.RIGHT_PADDING);
        const chartHeight = this.canvas.height - (this.TOP_PADDING + this.BOTTOM_PADDING);
        const mousePos = getMousePos(event, this.canvas);

        const visiblePoints = this.WAVEFORM_POINTS / this.state.hZoom;
        const localXScale = chartWidth / visiblePoints;
        
        const dataIndexFloat = (mousePos.x - this.LEFT_PADDING) / localXScale + this.state.viewOffset;
        const currentPointX = Math.floor(dataIndexFloat);

        if (currentPointX >= 0 && currentPointX < this.WAVEFORM_POINTS) {
            const vCenter = chartHeight / 2 + this.state.vShift;
            const vScale = (chartHeight / 2) * this.state.vZoom;
            let value = (vCenter - (mousePos.y - this.TOP_PADDING)) / vScale;
            value = Math.max(-1.0, Math.min(1.0, value));

            if (!this.lineStartPoint) {
                this.lineStartPoint = { x: currentPointX, y: value };
            } else {
                const startX = Math.min(this.lineStartPoint.x, currentPointX);
                const endX = Math.max(this.lineStartPoint.x, currentPointX);
                const startY_val = (this.lineStartPoint.x < currentPointX) ? this.lineStartPoint.y : value;
                const endY_val = (this.lineStartPoint.x < currentPointX) ? value : this.lineStartPoint.y;
                for (let i = startX; i <= endX; i++) {
                     if (i >= 0 && i < this.state.waveformData.length) {
                        const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
                        this.state.waveformData[i] = startY_val + t * (endY_val - startY_val);
                    }
                }
                this.lineStartPoint = null; // End line after drawing
                this.hooks.draw();
            }
        }
    }

    setEditMode(mode) {
        this.state.editMode = mode;
        this.lineStartPoint = null;
        this.isDrawing = false;
        this.lastPoint = { x: -1, y: -1 };
    }
}
