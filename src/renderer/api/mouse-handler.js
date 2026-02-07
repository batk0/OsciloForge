import { getMousePos } from './utils.js';
import { WAVEFORM_POINTS, TOP_PADDING, RIGHT_PADDING, BOTTOM_PADDING, LEFT_PADDING } from './state.js';

export class MouseHandler {
  constructor(canvas, state, hooks) {
    this.canvas = canvas;
    this.state = state;
    this.hooks = hooks;

    this.isDrawing = false;
    this.lastPoint = { x: -1, y: -1 };
    // this.lineStartPoint is now managed in state.js

    // Mouse pan/zoom state
    this.isPanning = false;
    this.isZooming = false;
    this.zoomDirection = 'none';
    this.dragStartPos = { x: 0, y: 0 };
    this.dragStartHOffset = 0;
    this.dragStartVOffset = 0;
    this.dragStartHZoom = 1;
    this.dragStartVZoom = 1;

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

    if (e.button !== 0) {
      return;
    }
    const chartWidth = this.canvas.width - (LEFT_PADDING + RIGHT_PADDING);
    const mousePos = getMousePos(e, this.canvas);
    if (mousePos.x < LEFT_PADDING || mousePos.x > LEFT_PADDING + chartWidth) {
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

      const chartWidth = this.canvas.clientWidth - (LEFT_PADDING + RIGHT_PADDING);
      const pointsPerPixel = (WAVEFORM_POINTS / this.state.hZoom) / chartWidth;
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
        const newHZoom = this.dragStartHZoom * zoomFactor;
        this.hooks.updateZoom('h', newHZoom);
      } else if (this.zoomDirection === 'vertical') {
        this.canvas.style.cursor = 'ns-resize';
        const zoomFactor = Math.pow(2, -deltaY / 200);
        const newVZoom = this.dragStartVZoom * zoomFactor;
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
      this.hooks.updateState({ lineStartPoint: null });
    }
  }

  endDrag() {
    this.isPanning = false;
    this.isZooming = false;
    this.zoomDirection = 'none';
    this.canvas.style.cursor = 'crosshair';
  }

  handleFreehandDraw(event) {
    if (!this.isDrawing) {
      return;
    }

    const chartWidth = this.canvas.width - (LEFT_PADDING + RIGHT_PADDING);
    const chartHeight = this.canvas.height - (TOP_PADDING + BOTTOM_PADDING);
    const mousePos = getMousePos(event, this.canvas);

    const visiblePoints = WAVEFORM_POINTS / this.state.hZoom;
    const localXScale = chartWidth / visiblePoints;

    const dataIndexFloat = (mousePos.x - LEFT_PADDING) / localXScale + this.state.viewOffset;
    const currentPointX = Math.floor(dataIndexFloat);

    if (currentPointX >= 0 && currentPointX < WAVEFORM_POINTS) {
      const vCenter = chartHeight / 2 + this.state.vShift;
      const vScale = (chartHeight / 2) * this.state.vZoom;
      let value = (vCenter - (mousePos.y - TOP_PADDING)) / vScale;
      value = Math.max(-1.0, Math.min(1.0, value));

      // Create updated waveformData array using proper state management
      const updatedWaveformData = new Float32Array(this.state.waveformData);

      if (this.lastPoint.x !== -1 && this.lastPoint.x !== currentPointX) {
        const startX = Math.min(this.lastPoint.x, currentPointX);
        const endX = Math.max(this.lastPoint.x, currentPointX);
        const startY = (this.lastPoint.x < currentPointX) ? this.lastPoint.y : value;
        const endY = (this.lastPoint.x < currentPointX) ? value : this.lastPoint.y;
        for (let i = startX; i <= endX; i++) {
          if (i >= 0 && i < updatedWaveformData.length) {
            const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
            updatedWaveformData[i] = startY + t * (endY - startY);
          }
        }
      } else {
        if (currentPointX >= 0 && currentPointX < updatedWaveformData.length) {
          updatedWaveformData[currentPointX] = value;
        }
      }

      // Update state using centralized state management
      this.hooks.updateState({ waveformData: updatedWaveformData });

      this.lastPoint = { x: currentPointX, y: value };
      this.hooks.draw();
    }
  }

  handleLineDraw(event) {
    const chartWidth = this.canvas.width - (LEFT_PADDING + RIGHT_PADDING);
    const chartHeight = this.canvas.height - (TOP_PADDING + BOTTOM_PADDING);
    const mousePos = getMousePos(event, this.canvas);

    const visiblePoints = WAVEFORM_POINTS / this.state.hZoom;
    const localXScale = chartWidth / visiblePoints;

    const dataIndexFloat = (mousePos.x - LEFT_PADDING) / localXScale + this.state.viewOffset;
    const currentPointX = Math.floor(dataIndexFloat);

    if (currentPointX >= 0 && currentPointX < WAVEFORM_POINTS) {
      const vCenter = chartHeight / 2 + this.state.vShift;
      const vScale = (chartHeight / 2) * this.state.vZoom;
      let value = (vCenter - (mousePos.y - TOP_PADDING)) / vScale;
      value = Math.max(-1.0, Math.min(1.0, value));

      if (!this.state.lineStartPoint) {
        this.hooks.updateState({ lineStartPoint: { x: currentPointX, y: value } });
      } else {
        // Create updated waveformData array using proper state management
        const updatedWaveformData = new Float32Array(this.state.waveformData);

        const startPoint = this.state.lineStartPoint;
        const startX = Math.min(startPoint.x, currentPointX);
        const endX = Math.max(startPoint.x, currentPointX);
        const startY_val = (startPoint.x < currentPointX) ? startPoint.y : value;
        const endY_val = (startPoint.x < currentPointX) ? value : startPoint.y;
        for (let i = startX; i <= endX; i++) {
          if (i >= 0 && i < updatedWaveformData.length) {
            const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
            updatedWaveformData[i] = startY_val + t * (endY_val - startY_val);
          }
        }

        // Update state using centralized state management
        // Update lineStartPoint to the current point to enable continuous drawing
        this.hooks.updateState({
          waveformData: updatedWaveformData,
          lineStartPoint: { x: currentPointX, y: value }
        });

        this.hooks.draw();
      }
    }
  }

  setEditMode(mode) {
    this.hooks.updateState({ editMode: mode, lineStartPoint: null });
    this.isDrawing = false;
    this.lastPoint = { x: -1, y: -1 };
  }
}
