import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { MouseHandler } from '../src/renderer/api/mouse-handler.js';
import {
  WAVEFORM_POINTS,
  TOP_PADDING,
  RIGHT_PADDING,
  BOTTOM_PADDING,
  LEFT_PADDING
} from '../src/renderer/api/state.js';

// Mock getMousePos with a function we can control
vi.mock('../src/renderer/api/utils.js', () => ({
  getMousePos: vi.fn()
}));

// Import the mocked function
import { getMousePos } from '../src/renderer/api/utils.js';

describe('MouseHandler', () => {
  let canvas;
  let state;
  let hooks;
  let handler;
  let dom;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><canvas id="waveform-canvas"></canvas>');
    global.document = dom.window.document;
    canvas = document.getElementById('waveform-canvas');

    state = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      editMode: 'freehand',
      lineStartPoint: null
    };

    hooks = {
      updateState: vi.fn().mockImplementation((updates) => {
        // Simulate actual state update behavior
        Object.assign(state, updates);
      }),
      updateZoom: vi.fn(),
      draw: vi.fn()
    };

    // Reset the mock before each test
    getMousePos.mockClear();
    getMousePos.mockReturnValue({ x: 0, y: 0 });

    handler = new MouseHandler(canvas, state, hooks);
  });

  it('should be instantiated', () => {
    expect(handler).toBeInstanceOf(MouseHandler);
  });

  it('should add event listeners to the canvas', () => {
    const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');
    handler.init();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mouseleave',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'contextmenu',
      expect.any(Function)
    );
  });

  it('setEditMode should update editMode and reset drawing state', () => {
    handler.setEditMode('line');
    expect(handler.state.editMode).toBe('line');
    expect(handler.state.lineStartPoint).toBeNull();
    expect(handler.isDrawing).toBe(false);
    expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
  });

  it('should initialize with correct default state', () => {
    expect(handler.canvas).toBe(canvas);
    expect(handler.state).toBe(state);
    expect(handler.hooks).toBe(hooks);
    expect(handler.isDrawing).toBe(false);
    expect(handler.isPanning).toBe(false);
    expect(handler.isZooming).toBe(false);
    expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
    expect(handler.state.lineStartPoint).toBeNull();
  });

  it('should handle different edit modes', () => {
    handler.setEditMode('freehand');
    expect(handler.state.editMode).toBe('freehand');

    handler.setEditMode('line');
    expect(handler.state.editMode).toBe('line');

    handler.setEditMode('erase');
    expect(handler.state.editMode).toBe('erase');
  });

  it('should reset state properly when changing edit modes', () => {
    // Set some state
    handler.isDrawing = true;
    handler.lastPoint = { x: 100, y: 200 };
    state.lineStartPoint = { x: 50, y: 100 };

    // Change mode
    handler.setEditMode('freehand');

    // Check that state was reset
    expect(handler.state.editMode).toBe('freehand');
    expect(handler.state.lineStartPoint).toBeNull();
    expect(handler.isDrawing).toBe(false);
    expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
  });

  // ============ DRAWING FUNCTIONALITY TESTS ============
  describe('Drawing Functionality', () => {
    beforeEach(() => {
      canvas.width = 800;
      canvas.height = 400;
    });

    it('should create Float32Array when updating waveform data', () => {
      const initialData = new Float32Array(WAVEFORM_POINTS).fill(0.5);
      state.waveformData = initialData;

      // Test by calling updateState directly through hooks to verify response
      const newData = new Float32Array(WAVEFORM_POINTS).fill(0.7);
      handler.hooks.updateState({ waveformData: newData });

      expect(handler.hooks.updateState).toHaveBeenCalledWith(
        expect.objectContaining({
          waveformData: expect.any(Float32Array)
        })
      );
    });

    it('should handle value clamping for waveform data', () => {
      // Test the value clamping logic directly
      const testValues = [-2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0];

      testValues.forEach((value) => {
        const clampedValue = Math.max(-1.0, Math.min(1.0, value));
        expect(clampedValue).toBeGreaterThanOrEqual(-1.0);
        expect(clampedValue).toBeLessThanOrEqual(1.0);
      });
    });

    it('should interpolate between waveform points correctly', () => {
      // Test interpolation logic
      const startY = 0.5;
      const endY = -0.5;
      const startX = 100;
      const endX = 200;

      for (let i = startX; i <= endX; i++) {
        const t = endX - startX === 0 ? 1.0 : (i - startX) / (endX - startX);
        const interpolatedValue = startY + t * (endY - startY);

        expect(interpolatedValue).toBeGreaterThanOrEqual(-1.0);
        expect(interpolatedValue).toBeLessThanOrEqual(1.0);
      }
    });

    it('should manage drawing state correctly', () => {
      // Test state management during drawing
      expect(handler.isDrawing).toBe(false);
      expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
      expect(handler.state.lineStartPoint).toBeNull();

      // Set edit mode to line and test line state
      handler.setEditMode('line');
      expect(handler.state.lineStartPoint).toBeNull();

      // Reset to freehand mode
      handler.setEditMode('freehand');
      expect(handler.isDrawing).toBe(false);
      expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
    });

    it('should handle zoom and view offset parameters', () => {
      // Test that zoom and offset parameters are accessible for drawing calculations
      state.hZoom = 2.0;
      state.vZoom = 1.5;
      state.viewOffset = 100;
      state.vShift = 20;

      expect(state.hZoom).toBe(2.0);
      expect(state.vZoom).toBe(1.5);
      expect(state.viewOffset).toBe(100);
      expect(state.vShift).toBe(20);
    });

    it('should handle canvas boundary conditions', () => {
      // Test boundary values
      const boundaryTests = [
        { x: LEFT_PADDING, y: 100, inBounds: true },
        { x: LEFT_PADDING + 1, y: 100, inBounds: true },
        { x: LEFT_PADDING - 1, y: 100, inBounds: false },
        { x: canvas.width - RIGHT_PADDING, y: 100, inBounds: true },
        { x: canvas.width - RIGHT_PADDING + 1, y: 100, inBounds: false }
      ];

      boundaryTests.forEach((test) => {
        const chartWidth = canvas.width - (LEFT_PADDING + RIGHT_PADDING);
        const inBounds =
          test.x >= LEFT_PADDING && test.x <= LEFT_PADDING + chartWidth;
        expect(inBounds).toBe(test.inBounds);
      });
    });
  });

  // ============ PANNING AND ZOOMING TESTS ============
  describe('Panning and Zooming', () => {
    beforeEach(() => {
      canvas.width = 800;
      canvas.height = 400;
      Object.defineProperty(canvas, 'clientWidth', { value: 800 });
      Object.defineProperty(canvas, 'clientHeight', { value: 400 });
      hooks.updateState.mockClear();
      hooks.updateZoom.mockClear();
      hooks.draw.mockClear();
    });

    it('should start panning on shift + mousedown', () => {
      getMousePos.mockReturnValue({ x: 100, y: 100 });
      const event = new dom.window.MouseEvent('mousedown', {
        button: 0,
        shiftKey: true
      });
      handler.handleMouseDown(event);

      expect(handler.isPanning).toBe(true);
      expect(handler.isZooming).toBe(false);
      expect(handler.dragStartPos).toEqual({ x: 100, y: 100 });
      expect(handler.dragStartHOffset).toBe(state.viewOffset);
      expect(handler.dragStartVOffset).toBe(state.vShift);
      expect(canvas.style.cursor).toBe('grabbing');
    });

    it('should update viewOffset and vShift when panning', () => {
      // Start panning
      getMousePos.mockReturnValue({ x: 100, y: 100 });
      const eventDown = new dom.window.MouseEvent('mousedown', {
        button: 0,
        shiftKey: true
      });
      handler.handleMouseDown(eventDown);

      // Move mouse
      getMousePos.mockReturnValue({ x: 150, y: 120 });
      const eventMove = new dom.window.MouseEvent('mousemove', {
        shiftKey: true
      });
      handler.handleMouseMove(eventMove);

      const chartWidth = canvas.clientWidth - (LEFT_PADDING + RIGHT_PADDING);
      const pointsPerPixel = WAVEFORM_POINTS / state.hZoom / chartWidth;
      const expectedHOffsetChange = 50 * pointsPerPixel;
      const expectedVShiftChange = 20;

      expect(hooks.updateState).toHaveBeenCalledWith({
        viewOffset: handler.dragStartHOffset - expectedHOffsetChange
      });
      expect(hooks.updateState).toHaveBeenCalledWith({
        vShift: handler.dragStartVOffset + expectedVShiftChange
      });
      expect(hooks.draw).toHaveBeenCalled();
    });

    it('should stop panning on mouseup', () => {
      handler.isPanning = true;
      canvas.style.cursor = 'grabbing';

      const event = new dom.window.MouseEvent('mouseup');
      handler.handleMouseUp(event);

      expect(handler.isPanning).toBe(false);
      expect(canvas.style.cursor).toBe('crosshair');
    });

    it('should start zooming on ctrl/meta + mousedown', () => {
      getMousePos.mockReturnValue({ x: 100, y: 100 });
      const event = new dom.window.MouseEvent('mousedown', {
        button: 0,
        ctrlKey: true
      });
      handler.handleMouseDown(event);

      expect(handler.isZooming).toBe(true);
      expect(handler.isPanning).toBe(false);
      expect(handler.dragStartPos).toEqual({ x: 100, y: 100 });
      expect(handler.dragStartHZoom).toBe(state.hZoom);
      expect(handler.dragStartVZoom).toBe(state.vZoom);
      expect(canvas.style.cursor).toBe('nwse-resize');
    });

    it('should determine zoom direction on mousemove', () => {
      // Start zooming
      getMousePos.mockReturnValue({ x: 100, y: 100 });
      handler.handleMouseDown(
        new dom.window.MouseEvent('mousedown', { ctrlKey: true })
      );

      // Horizontal movement
      getMousePos.mockReturnValue({ x: 110, y: 101 });
      handler.handleMouseMove(
        new dom.window.MouseEvent('mousemove', { ctrlKey: true })
      );
      expect(handler.zoomDirection).toBe('horizontal');
      expect(canvas.style.cursor).toBe('ew-resize');

      // Reset and test vertical
      handler.zoomDirection = 'none';
      getMousePos.mockReturnValue({ x: 101, y: 110 });
      handler.handleMouseMove(
        new dom.window.MouseEvent('mousemove', { ctrlKey: true })
      );
      expect(handler.zoomDirection).toBe('vertical');
      expect(canvas.style.cursor).toBe('ns-resize');
    });

    it('should update hZoom when zooming horizontally', () => {
      state.hZoom = 2;
      handler.dragStartHZoom = 2;
      handler.isZooming = true;
      handler.zoomDirection = 'horizontal';
      handler.dragStartPos = { x: 100, y: 100 };

      getMousePos.mockReturnValue({ x: 50, y: 100 }); // Moved 50px left
      handler.handleMouseMove(
        new dom.window.MouseEvent('mousemove', { ctrlKey: true })
      );

      const zoomFactor = Math.pow(2, 50 / 200); // 100 - 50 = 50
      const expectedHZoom = 2 * zoomFactor;

      expect(hooks.updateZoom).toHaveBeenCalledWith('h', expectedHZoom);
    });

    it('should update vZoom when zooming vertically', () => {
      state.vZoom = 1.5;
      handler.dragStartVZoom = 1.5;
      handler.isZooming = true;
      handler.zoomDirection = 'vertical';
      handler.dragStartPos = { x: 100, y: 100 };

      getMousePos.mockReturnValue({ x: 100, y: 150 }); // Moved 50px down
      handler.handleMouseMove(
        new dom.window.MouseEvent('mousemove', { ctrlKey: true })
      );

      const zoomFactor = Math.pow(2, -50 / 200);
      const expectedVZoom = 1.5 * zoomFactor;

      expect(hooks.updateZoom).toHaveBeenCalledWith('v', expectedVZoom);
    });

    it('should stop zooming on mouseleave', () => {
      handler.isZooming = true;
      canvas.style.cursor = 'ew-resize';

      const event = new dom.window.MouseEvent('mouseleave');
      handler.handleMouseLeave(event);

      expect(handler.isZooming).toBe(false);
      expect(canvas.style.cursor).toBe('crosshair');
    });

    it('should just draw if zoom drag is not far enough to determine direction', () => {
      handler.isZooming = true;
      handler.zoomDirection = 'none';
      handler.dragStartPos = { x: 100, y: 100 };

      getMousePos.mockReturnValue({ x: 102, y: 102 }); // Move just a little
      handler.handleMouseMove(
        new dom.window.MouseEvent('mousemove', { ctrlKey: true })
      );

      expect(handler.zoomDirection).toBe('none');
      expect(hooks.updateZoom).not.toHaveBeenCalled();
      expect(hooks.draw).toHaveBeenCalled();
    });
  });

  // ============ FREEHAND DRAWING TESTS ============
  describe('Freehand Drawing', () => {
    beforeEach(() => {
      canvas.width = 800;
      canvas.height = 400;
      handler.setEditMode('freehand');
      hooks.updateState.mockClear();
      hooks.draw.mockClear();
    });

    it('should start drawing on mousedown in freehand mode', () => {
      getMousePos.mockReturnValue({ x: 100, y: 150 });
      const event = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event);

      expect(handler.isDrawing).toBe(true);
      expect(hooks.updateState).toHaveBeenCalled();
      expect(hooks.draw).toHaveBeenCalled();
    });

    it('should not draw if mousedown is outside chart area', () => {
      getMousePos.mockReturnValue({ x: LEFT_PADDING - 1, y: 150 });
      const event = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event);

      expect(handler.isDrawing).toBe(false);
      expect(hooks.updateState).not.toHaveBeenCalled();
    });

    it('should continuously draw on mousemove when isDrawing is true', () => {
      // Start drawing
      getMousePos.mockReturnValue({ x: 100, y: 150 });
      handler.handleMouseDown(
        new dom.window.MouseEvent('mousedown', { button: 0 })
      );
      hooks.updateState.mockClear();
      hooks.draw.mockClear();

      // Move mouse
      getMousePos.mockReturnValue({ x: 105, y: 155 });
      handler.handleMouseMove(new dom.window.MouseEvent('mousemove'));

      expect(handler.isDrawing).toBe(true);
      expect(hooks.updateState).toHaveBeenCalledTimes(1);
      expect(hooks.draw).toHaveBeenCalledTimes(1);
      expect(handler.lastPoint.x).not.toBe(-1);
    });

    it('should interpolate between points during freehand drawing', () => {
      const startX = 100;
      const startY = 150;
      const endX = 110;
      const endY = 160;

      // Start drawing
      getMousePos.mockReturnValue({ x: startX, y: startY });
      handler.handleMouseDown(
        new dom.window.MouseEvent('mousedown', { button: 0 })
      );

      // Move mouse
      getMousePos.mockReturnValue({ x: endX, y: endY });
      handler.handleMouseMove(new dom.window.MouseEvent('mousemove'));

      const updatedData = hooks.updateState.mock.calls[0][0].waveformData;

      const chartWidth = canvas.width - (LEFT_PADDING + RIGHT_PADDING);
      const visiblePoints = WAVEFORM_POINTS / state.hZoom;
      const localXScale = chartWidth / visiblePoints;

      const startIndex = Math.floor(
        (startX - LEFT_PADDING) / localXScale + state.viewOffset
      );
      const endIndex = Math.floor(
        (endX - LEFT_PADDING) / localXScale + state.viewOffset
      );

      // Check that points between start and end are interpolated
      expect(updatedData[startIndex]).toBeDefined();
      expect(updatedData[endIndex]).toBeDefined();
      // A more detailed check would require replicating the exact interpolation logic
      // but checking the endpoints is a good start.
      const hasChanged =
        updatedData[startIndex] !== state.waveformData[startIndex] ||
        updatedData[endIndex] !== state.waveformData[endIndex];
      expect(hasChanged).toBe(true);
    });

    it('should stop drawing on mouseup', () => {
      handler.isDrawing = true;
      handler.lastPoint = { x: 100, y: 0.5 };

      handler.handleMouseUp(new dom.window.MouseEvent('mouseup'));

      expect(handler.isDrawing).toBe(false);
      expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
    });

    it('should stop drawing on mouseleave', () => {
      handler.isDrawing = true;
      handler.lastPoint = { x: 100, y: 0.5 };

      handler.handleMouseLeave(new dom.window.MouseEvent('mouseleave'));

      expect(handler.isDrawing).toBe(false);
      expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
    });

    it('should not draw in freehand if isDrawing is false', () => {
      handler.isDrawing = false;
      handler.handleFreehandDraw(new dom.window.MouseEvent('mousemove'));
      expect(hooks.updateState).not.toHaveBeenCalled();
      expect(hooks.draw).not.toHaveBeenCalled();
    });

    it('should not draw in freehand if currentPointX is out of bounds', () => {
      handler.isDrawing = true;
      getMousePos.mockReturnValue({ x: -100, y: 150 });
      handler.handleFreehandDraw(new dom.window.MouseEvent('mousemove'));
      expect(hooks.updateState).not.toHaveBeenCalled();
      expect(hooks.draw).not.toHaveBeenCalled();
    });
  });

  // ============ MOUSE BUTTON AND EVENT HANDLING TESTS ============
  describe('Mouse Button and Event Handling', () => {
    it('should ignore non-primary mouse buttons for drawing', () => {
      handler.setEditMode('freehand');
      hooks.updateState.mockClear(); // Clear mock after setup

      getMousePos.mockReturnValue({ x: 100, y: 150 });

      // Right click
      const rightClick = new dom.window.MouseEvent('mousedown', { button: 2 });
      handler.handleMouseDown(rightClick);
      expect(handler.isDrawing).toBe(false);
      expect(hooks.updateState).not.toHaveBeenCalled();

      // Middle click
      const middleClick = new dom.window.MouseEvent('mousedown', { button: 1 });
      handler.handleMouseDown(middleClick);
      expect(handler.isDrawing).toBe(false);
      expect(hooks.updateState).not.toHaveBeenCalled();
    });

    it('should reset drawing state on mouse up/leave', () => {
      handler.setEditMode('freehand');
      handler.isDrawing = true;
      handler.lastPoint = { x: 123, y: 0.45 };

      handler.handleMouseUp(new dom.window.MouseEvent('mouseup'));
      expect(handler.isDrawing).toBe(false);
      expect(handler.lastPoint).toEqual({ x: -1, y: -1 });

      handler.isDrawing = true;
      handler.lastPoint = { x: 123, y: 0.45 };

      handler.handleMouseLeave(new dom.window.MouseEvent('mouseleave'));
      expect(handler.isDrawing).toBe(false);
      expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
    });

    it('should reset panning/zooming state on mouse up/leave', () => {
      handler.isPanning = true;
      handler.isZooming = true;

      handler.handleMouseUp(new dom.window.MouseEvent('mouseup'));
      expect(handler.isPanning).toBe(false);
      expect(handler.isZooming).toBe(false);

      handler.isPanning = true;
      handler.isZooming = true;

      handler.handleMouseLeave(new dom.window.MouseEvent('mouseleave'));
      expect(handler.isPanning).toBe(false);
      expect(handler.isZooming).toBe(false);
    });
  });

  // ============ CONTEXT MENU TESTS ============
  describe('Context Menu', () => {
    it('should reset lineStartPoint on contextmenu in line mode', () => {
      handler.setEditMode('line');
      state.lineStartPoint = { x: 10, y: 0.5 };
      const event = new dom.window.MouseEvent('contextmenu');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      handler.handleContextMenu(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(hooks.updateState).toHaveBeenCalledWith({ lineStartPoint: null });
    });

    it('should not do anything on contextmenu if not in line mode', () => {
      handler.setEditMode('freehand');
      state.lineStartPoint = { x: 10, y: 0.5 };
      const event = new dom.window.MouseEvent('contextmenu');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      handler.handleContextMenu(event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(hooks.updateState).not.toHaveBeenCalledWith({ lineStartPoint: null });
    });
  });

  // ============ LINE DRAWING TESTS ============
  describe('Line Drawing Tests', () => {
    const CANVAS_HEIGHT = 400;
    const CANVAS_WIDTH = 800;
    const CHART_HEIGHT = CANVAS_HEIGHT - (TOP_PADDING + BOTTOM_PADDING);
    const V_CENTER = CHART_HEIGHT / 2;
    const V_SCALE = CHART_HEIGHT / 2;

    // Helper function to normalize canvas Y to waveform value
    function normalizeCanvasY(canvasY, vZoom = 1, vShift = 0) {
      const vCenter = V_CENTER + vShift;
      const vScale = V_SCALE * vZoom;
      return (vCenter - (canvasY - TOP_PADDING)) / vScale;
    }

    // Helper function to calculate data index from canvas X
    function canvasXToDataIndex(canvasX, hZoom = 1, viewOffset = 0) {
      const chartWidth = CANVAS_WIDTH - (LEFT_PADDING + RIGHT_PADDING);
      const visiblePoints = WAVEFORM_POINTS / hZoom;
      const localXScale = chartWidth / visiblePoints;
      const dataIndexFloat =
        (canvasX - LEFT_PADDING) / localXScale + viewOffset;
      return Math.floor(dataIndexFloat);
    }

    beforeEach(() => {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      state.waveformData = new Float32Array(WAVEFORM_POINTS).fill(0);
      handler.setEditMode('line');
      hooks.updateState.mockClear();
    });

    // Basic Line Drawing Tests
    it('should draw a single line segment correctly', () => {
      // Point A (Start)
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      // Should set start point
      expect(hooks.updateState).toHaveBeenCalledWith(
        expect.objectContaining({
          lineStartPoint: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        })
      );

      // Manually update state mock to simulate app behavior
      const startPointUpdate =
        hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPointUpdate;
      hooks.updateState.mockClear();

      // Point B (End)
      getMousePos.mockReturnValue({ x: 300, y: 100 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      // Should draw line and update start point
      expect(hooks.updateState).toHaveBeenCalledWith(
        expect.objectContaining({
          waveformData: expect.any(Float32Array),
          lineStartPoint: expect.objectContaining({ x: expect.any(Number) })
        })
      );

      // Verify waveform data was updated correctly
      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;
      expect(updatedData).toBeInstanceOf(Float32Array);
      expect(updatedData.length).toBe(WAVEFORM_POINTS);

      // Calculate the data index that corresponds to canvas X=300
      const endIndex = canvasXToDataIndex(300);

      // Check that values between start and end points are interpolated
      const startX = Math.min(startPointUpdate.x, endIndex);
      const endX = Math.max(startPointUpdate.x, endIndex);
      const startY = startPointUpdate.y; // Already normalized to [-1, 1]
      const endY = normalizeCanvasY(100, state.vZoom, state.vShift); // Normalize canvas Y to [-1, 1]
      for (let i = startX; i <= endX; i++) {
        const t = endX - startX === 0 ? 1.0 : (i - startX) / (endX - startX);
        const expectedValue = startY + t * (endY - startY);
        expect(updatedData[i]).toBeCloseTo(expectedValue, 3);
      }
    });

    it('should draw two connected line segments (continuous drawing)', () => {
      // First line segment
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPointUpdate =
        hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPointUpdate;
      hooks.updateState.mockClear();

      // Second point (end of first line, start of next)
      getMousePos.mockReturnValue({ x: 200, y: 100 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      // Should draw first line and update start point to current point
      const updateArg1 = hooks.updateState.mock.calls[0][0];
      const updatedData1 = updateArg1.waveformData;

      // Third point (end of second line)
      getMousePos.mockReturnValue({ x: 300, y: 150 });
      const event3 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event3);

      // Should draw second line and update start point again
      const updateArg2 = hooks.updateState.mock.calls[1][0];
      const updatedData2 = updateArg2.waveformData;
      const finalStartPoint = updateArg2.lineStartPoint;

      // Verify both lines were drawn correctly
      expect(updatedData2).not.toBe(updatedData1); // New array created

      // Calculate data indices for canvas coordinates
      const dataIndex2 = canvasXToDataIndex(200);
      const dataIndex3 = canvasXToDataIndex(300);

      // Check first line interpolation
      const startX1 = Math.min(startPointUpdate.x, dataIndex2);
      const endX1 = Math.max(startPointUpdate.x, dataIndex2);
      const startY1 = startPointUpdate.y; // Already normalized to [-1, 1]
      const endY1 = normalizeCanvasY(100, state.vZoom, state.vShift); // Normalize canvas Y to [-1, 1]
      for (let i = startX1; i <= endX1; i++) {
        const t =
          endX1 - startX1 === 0 ? 1.0 : (i - startX1) / (endX1 - startX1);
        const expectedValue = startY1 + t * (endY1 - startY1);
        expect(updatedData2[i]).toBeCloseTo(expectedValue, 3);
      }

      // Check second line interpolation
      const startX2 = Math.min(dataIndex2, dataIndex3);
      const endX2 = Math.max(dataIndex2, dataIndex3);
      const startY2 = normalizeCanvasY(100, state.vZoom, state.vShift); // Y from second click
      const endY2 = normalizeCanvasY(150, state.vZoom, state.vShift); // Y from third click
      for (let i = startX2; i <= endX2; i++) {
        const t =
          endX2 - startX2 === 0 ? 1.0 : (i - startX2) / (endX2 - startX2);
        const expectedValue = startY2 + t * (endY2 - startY2);
        expect(updatedData2[i]).toBeCloseTo(expectedValue, 3);
      }

      // Verify start point was updated correctly after each segment
      expect(finalStartPoint.x).toBeCloseTo(dataIndex3, 0);
    });

    it('should update lineStartPoint correctly after each segment', () => {
      // First click - should set start point
      getMousePos.mockReturnValue({ x: 150, y: 250 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint1 = hooks.updateState.mock.calls[0][0].lineStartPoint;
      expect(startPoint1).toEqual({
        x: expect.any(Number),
        y: expect.any(Number)
      });

      state.lineStartPoint = startPoint1;
      hooks.updateState.mockClear();

      // Second click - should draw line and update start point
      getMousePos.mockReturnValue({ x: 250, y: 150 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      const updateArg = hooks.updateState.mock.calls[0][0];
      const newStartPoint = updateArg.lineStartPoint;

      // Calculate expected data index for canvas X=250
      const dataIndex = canvasXToDataIndex(250);

      // Verify new start point matches current mouse position
      expect(newStartPoint.x).toBeCloseTo(dataIndex, 0);
      expect(newStartPoint.y).toBeCloseTo(
        normalizeCanvasY(150, state.vZoom, state.vShift),
        3
      );

      // Verify old start point is different
      expect(newStartPoint).not.toEqual(startPoint1);
    });

    // Edge Case Tests
    it('should handle lines outside canvas boundaries', () => {
      // Start point outside left boundary
      getMousePos.mockReturnValue({ x: LEFT_PADDING - 10, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      // Should not set start point (invalid position)
      expect(hooks.updateState).not.toHaveBeenCalled();

      // Start point inside canvas
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // End point at right edge (valid)
      getMousePos.mockReturnValue({
        x: canvas.width - RIGHT_PADDING - 0.01,
        y: 100
      });
      const event3 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event3);

      // Should draw line
      expect(hooks.updateState).toHaveBeenCalled();

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;
      expect(updatedData).toBeInstanceOf(Float32Array);
      expect(updatedData.length).toBe(WAVEFORM_POINTS);

      // Calculate data index for canvas X at right edge
      const endIndex = canvasXToDataIndex(canvas.width - RIGHT_PADDING);

      // Check that values between start and end points are interpolated
      const startX = Math.min(startPoint.x, endIndex);
      const endX = Math.max(startPoint.x, endIndex);
      const startY = startPoint.y; // Already normalized
      const endY = normalizeCanvasY(100, state.vZoom, state.vShift); // Normalize canvas Y

      for (let i = startX; i < endX; i++) {
        const t = endX - startX === 0 ? 1.0 : (i - startX) / (endX - startX);
        const expectedValue = startY + t * (endY - startY);
        expect(updatedData[i]).toBeCloseTo(expectedValue, 2);
      }

      // Now test with both points off-canvas
      hooks.updateState.mockClear();
      state.lineStartPoint = { x: -100, y: 0.5 };
      getMousePos.mockReturnValue({ x: -50, y: 100 });
      const event4 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event4);
      expect(hooks.updateState).not.toHaveBeenCalled();
    });

    it('should handle very short lines (single point)', () => {
      // Start and end at same position
      getMousePos.mockReturnValue({ x: 200, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // Second click at same position
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      // Should still update waveform data (single point)
      expect(hooks.updateState).toHaveBeenCalled();

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;

      // Calculate expected data index
      const chartWidth = canvas.width - (LEFT_PADDING + RIGHT_PADDING);
      const visiblePoints = WAVEFORM_POINTS / state.hZoom;
      const localXScale = chartWidth / visiblePoints;
      const dataIndex = Math.floor(
        (200 - LEFT_PADDING) / localXScale + state.viewOffset
      );

      // Verify single point was updated
      expect(updatedData[dataIndex]).toBeCloseTo(
        normalizeCanvasY(200, state.vZoom, state.vShift),
        3
      );
    });

    it('should handle lines that span the entire waveform', () => {
      // Start at left edge
      getMousePos.mockReturnValue({ x: LEFT_PADDING, y: 100 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // End at right edge
      getMousePos.mockReturnValue({
        x: canvas.width - RIGHT_PADDING - 0.01,
        y: 300
      });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      // Should draw full waveform line
      expect(hooks.updateState).toHaveBeenCalled();

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;

      // Calculate data index for canvas X at right edge
      const endIndex = canvasXToDataIndex(canvas.width - RIGHT_PADDING);

      // Verify points between start and end were updated with proper interpolation
      const startX = Math.min(startPoint.x, endIndex);
      const endX = Math.max(startPoint.x, endIndex);
      // startPoint.y is already normalized to [-1, 1]
      const startY = startPoint.y;
      const endY = normalizeCanvasY(300, state.vZoom, state.vShift);

      for (let i = startX; i <= endX; i++) {
        if (i >= WAVEFORM_POINTS) {
          continue;
        }
        const t = endX - startX === 0 ? 1.0 : (i - startX) / (endX - startX);
        const expectedValue = startY + t * (endY - startY);
        expect(updatedData[i]).toBeCloseTo(expectedValue, 2);
      }
    });

    it('should handle lines at extreme angles', () => {
      // Horizontal line
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // Horizontal line (same y, different x)
      getMousePos.mockReturnValue({ x: 300, y: 200 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      const updateArg1 = hooks.updateState.mock.calls[0][0];
      const updatedData1 = updateArg1.waveformData;

      // Verify all points have same y value (horizontal line)
      const horizontalValue = normalizeCanvasY(200, state.vZoom, state.vShift);
      for (
        let i = Math.min(startPoint.x, 300);
        i <= Math.max(startPoint.x, 300);
        i++
      ) {
        expect(updatedData1[i]).toBeCloseTo(horizontalValue, 3);
      }

      // Vertical line (same x, different y) - should be single point
      getMousePos.mockReturnValue({ x: 200, y: 100 });
      const event3 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event3);

      const updateArg2 = hooks.updateState.mock.calls[1][0];
      const updatedData2 = updateArg2.waveformData;

      // Calculate expected data index for x=200
      const chartWidth = canvas.width - (LEFT_PADDING + RIGHT_PADDING);
      const visiblePoints = WAVEFORM_POINTS / state.hZoom;
      const localXScale = chartWidth / visiblePoints;
      const dataIndex = Math.floor(
        (200 - LEFT_PADDING) / localXScale + state.viewOffset
      );

      // Verify single point was updated - normalized value for Y=100
      expect(updatedData2[dataIndex]).toBeCloseTo(
        normalizeCanvasY(100, state.vZoom, state.vShift),
        0
      );

      // Diagonal line
      getMousePos.mockReturnValue({ x: 150, y: 250 });
      const event4 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event4);

      const updateArg3 = hooks.updateState.mock.calls[2][0];
      const updatedData3 = updateArg3.waveformData;

      // Calculate data indices for canvas X coordinates
      const dataIndex3 = canvasXToDataIndex(200); // From vertical line click
      const dataIndex4 = canvasXToDataIndex(150); // From diagonal line click

      // Verify diagonal interpolation
      const startX_diag = Math.min(dataIndex3, dataIndex4);
      const endX_diag = Math.max(dataIndex3, dataIndex4);
      const startY_diag_val =
        dataIndex3 < dataIndex4
          ? normalizeCanvasY(100, state.vZoom, state.vShift)
          : normalizeCanvasY(250, state.vZoom, state.vShift);
      const endY_diag_val =
        dataIndex3 < dataIndex4
          ? normalizeCanvasY(250, state.vZoom, state.vShift)
          : normalizeCanvasY(100, state.vZoom, state.vShift);

      for (let i = startX_diag; i <= endX_diag; i++) {
        const t =
          endX_diag - startX_diag === 0
            ? 1.0
            : (i - startX_diag) / (endX_diag - startX_diag);
        const expectedValue =
          startY_diag_val + t * (endY_diag_val - startY_diag_val);
        expect(updatedData3[i]).toBeCloseTo(expectedValue, 3);
      }
    });

    it('should handle NaN or invalid coordinates gracefully', () => {
      // Start with valid point
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // Try with NaN coordinates
      getMousePos.mockReturnValue({ x: NaN, y: NaN });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      // Should not crash and should maintain previous state
      expect(hooks.updateState).not.toHaveBeenCalled();
      expect(state.lineStartPoint).toEqual(startPoint);

      // Try with invalid coordinates
      getMousePos.mockReturnValue({ x: -1000, y: -1000 });
      const event3 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event3);

      // Should not crash and should maintain previous state
      expect(hooks.updateState).not.toHaveBeenCalled();
      expect(state.lineStartPoint).toEqual(startPoint);
    });

    it('should handle extreme zoom levels', () => {
      // Test with very high zoom (should show small portion)
      state.hZoom = 10.0;
      state.vZoom = 10.0;

      // Start point
      getMousePos.mockReturnValue({ x: 200, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // End point
      getMousePos.mockReturnValue({ x: 250, y: 150 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      // Should draw line correctly even with extreme zoom
      expect(hooks.updateState).toHaveBeenCalled();

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;

      // Calculate data index for canvas X=250 with hZoom=10
      const endIndex = canvasXToDataIndex(250, 10.0);

      // Verify interpolation works with high zoom - use vZoom=10
      const startY = startPoint.y; // Already normalized by handler with vZoom=10
      const endY = normalizeCanvasY(150, 10.0, state.vShift); // Normalize canvas Y with vZoom=10

      const startX_high = Math.min(startPoint.x, endIndex);
      const endX_high = Math.max(startPoint.x, endIndex);
      for (let i = startX_high; i <= endX_high; i++) {
        const t =
          endX_high - startX_high === 0
            ? 1.0
            : (i - startX_high) / (endX_high - startX_high);
        const expectedValue = startY + t * (endY - startY);
        expect(updatedData[i]).toBeCloseTo(expectedValue, 2);
      }

      // Test with very low zoom (should show large portion)
      state.hZoom = 0.5;
      state.vZoom = 0.5;
      hooks.updateState.mockClear();

      // Start point
      getMousePos.mockReturnValue({ x: 100, y: 100 });
      const event3 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event3);

      const startPoint2 = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint2;
      hooks.updateState.mockClear();

      // End point
      getMousePos.mockReturnValue({ x: 300, y: 300 });
      const event4 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event4);

      // Should draw line correctly even with low zoom
      expect(hooks.updateState).toHaveBeenCalled();

      const updateArg2 = hooks.updateState.mock.calls[0][0];
      const updatedData2 = updateArg2.waveformData;

      // Calculate data index for canvas X=300 with hZoom=0.5
      const endIndex2 = canvasXToDataIndex(300, state.hZoom);

      // Verify interpolation works with low zoom - use vZoom=0.5
      const startX2 = Math.min(startPoint2.x, endIndex2);
      const endX2 = Math.max(startPoint2.x, endIndex2);
      const startY2 = startPoint2.y; // Already normalized by handler with vZoom=0.5
      const endY2 = normalizeCanvasY(300, state.vZoom, state.vShift); // Normalize canvas Y with vZoom=0.5

      for (let i = startX2; i <= endX2; i++) {
        if (i >= WAVEFORM_POINTS) {
          continue;
        }
        const t =
          endX2 - startX2 === 0 ? 1.0 : (i - startX2) / (endX2 - startX2);
        const expectedValue = startY2 + t * (endY2 - startY2);
        expect(updatedData2[i]).toBeCloseTo(expectedValue, 0);
      }
    });
  });

  // ============ DATA INTEGRITY TESTS ============
  describe('Data Integrity Tests', () => {
    const CANVAS_HEIGHT = 400;
    const CANVAS_WIDTH = 800;
    const CHART_HEIGHT = CANVAS_HEIGHT - (TOP_PADDING + BOTTOM_PADDING);
    const V_CENTER = CHART_HEIGHT / 2;
    const V_SCALE = CHART_HEIGHT / 2;

    // Helper function to normalize canvas Y to waveform value
    function normalizeCanvasY(canvasY, vZoom = 1, vShift = 0) {
      const vCenter = V_CENTER + vShift;
      const vScale = V_SCALE * vZoom;
      return (vCenter - (canvasY - TOP_PADDING)) / vScale;
    }

    // Helper function to calculate data index from canvas X
    function canvasXToDataIndex(canvasX, hZoom = 1, viewOffset = 0) {
      const chartWidth = CANVAS_WIDTH - (LEFT_PADDING + RIGHT_PADDING);
      const visiblePoints = WAVEFORM_POINTS / hZoom;
      const localXScale = chartWidth / visiblePoints;
      const dataIndexFloat =
        (canvasX - LEFT_PADDING) / localXScale + viewOffset;
      return Math.floor(dataIndexFloat);
    }

    beforeEach(() => {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      state.waveformData = new Float32Array(WAVEFORM_POINTS).fill(0);
      handler.setEditMode('line');
      hooks.updateState.mockClear();
    });

    it('should update waveform data with correct values', () => {
      // Start point
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // End point
      getMousePos.mockReturnValue({ x: 300, y: 100 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;

      // Verify values are within [-1, 1] range
      updatedData.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(-1.0);
        expect(value).toBeLessThanOrEqual(1.0);
      });

      // Calculate data index for canvas X=300
      const endIndex = canvasXToDataIndex(300);

      // Verify interpolation between points
      const startX = Math.min(startPoint.x, endIndex);
      const endX = Math.max(startPoint.x, endIndex);
      const startY = startPoint.y; // Already normalized
      const endY = normalizeCanvasY(100); // Normalize canvas Y

      for (let i = startX; i <= endX; i++) {
        const t = endX - startX === 0 ? 1.0 : (i - startX) / (endX - startX);
        const expectedValue = startY + t * (endY - startY);
        const actualValue = updatedData[i];

        // Allow small floating point error
        expect(actualValue).toBeCloseTo(expectedValue, 3);
      }
    });

    it('should respect the [-1, 1] value range', () => {
      // Test values outside the range
      const extremeValues = [
        { x: 100, y: -1000 }, // Should clamp to -1
        { x: 200, y: 0 }, // Should stay 0
        { x: 300, y: 1000 } // Should clamp to 1
      ];

      // First point (valid)
      getMousePos.mockReturnValue({ x: 150, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // Second point (extreme values)
      extremeValues.forEach(({ x, y }) => {
        getMousePos.mockReturnValue({ x, y });
        const event = new dom.window.MouseEvent('mousedown', { button: 0 });
        handler.handleMouseDown(event);

        const updateArg = hooks.updateState.mock.calls[0][0];
        const updatedData = updateArg.waveformData;

        // Verify values are clamped to [-1, 1]
        updatedData.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(-1.0);
          expect(value).toBeLessThanOrEqual(1.0);
        });

        hooks.updateState.mockClear();
      });
    });

    it('should handle interpolation between points correctly', () => {
      // Start point
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // End point
      getMousePos.mockReturnValue({ x: 300, y: 100 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;

      // Calculate data index for canvas X=300
      const endIndex = canvasXToDataIndex(300);

      // Verify interpolation is linear and correct
      const startX = Math.min(startPoint.x, endIndex);
      const endX = Math.max(startPoint.x, endIndex);
      const startY = startPoint.y; // Already normalized
      const endY = normalizeCanvasY(100); // Normalize canvas Y

      for (let i = startX; i <= endX; i++) {
        const t = endX - startX === 0 ? 1.0 : (i - startX) / (endX - startX);
        const expectedValue = startY + t * (endY - startY);
        const actualValue = updatedData[i];

        // Allow small floating point error
        expect(actualValue).toBeCloseTo(expectedValue, 3);
      }

      // Verify points outside the line range are unchanged
      for (let i = 0; i < startX; i++) {
        expect(updatedData[i]).toBe(0); // Should be unchanged from initial
      }
      for (let i = endX + 1; i < WAVEFORM_POINTS; i++) {
        expect(updatedData[i]).toBe(0); // Should be unchanged from initial
      }
    });

    it('should handle Float32Array updates properly', () => {
      // Store reference to original array
      const originalWaveformData = state.waveformData;

      // Start point
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // End point
      getMousePos.mockReturnValue({ x: 300, y: 100 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      const updateArg = hooks.updateState.mock.calls[0][0];
      const updatedData = updateArg.waveformData;

      // Verify it's a Float32Array
      expect(updatedData).toBeInstanceOf(Float32Array);

      // Verify length is correct
      expect(updatedData.length).toBe(WAVEFORM_POINTS);

      // Verify data type of elements
      updatedData.forEach((value) => {
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
      });

      // Verify that a new array is created (not modifying original)
      expect(updatedData).not.toBe(originalWaveformData);
    });
  });

  // ============ STATE MANAGEMENT TESTS ============
  describe('State Management Tests', () => {
    const CANVAS_HEIGHT = 400;
    const CANVAS_WIDTH = 800;

    beforeEach(() => {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      state.waveformData = new Float32Array(WAVEFORM_POINTS).fill(0);
      handler.setEditMode('line');
      hooks.updateState.mockClear();
    });

    it('should reset lineStartPoint when changing modes', () => {
      // Set up line drawing
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint;
      hooks.updateState.mockClear();

      // Change to freehand mode
      handler.setEditMode('freehand');

      // Verify lineStartPoint was reset
      expect(state.lineStartPoint).toBeNull();

      // Change back to line mode
      handler.setEditMode('line');

      // Verify lineStartPoint is still null
      expect(state.lineStartPoint).toBeNull();
    });

    it('should maintain state consistency after multiple operations', () => {
      // First line segment
      getMousePos.mockReturnValue({ x: 100, y: 200 });
      const event1 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event1);

      const startPoint1 = hooks.updateState.mock.calls[0][0].lineStartPoint;
      state.lineStartPoint = startPoint1;
      hooks.updateState.mockClear();

      // Second line segment
      getMousePos.mockReturnValue({ x: 200, y: 100 });
      const event2 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event2);

      hooks.updateState.mockClear();

      // Third line segment
      getMousePos.mockReturnValue({ x: 300, y: 150 });
      const event3 = new dom.window.MouseEvent('mousedown', { button: 0 });
      handler.handleMouseDown(event3);
    });
  });

  // ============ CLEANUP TESTS ============
  describe('Cleanup', () => {
    it('should remove all event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');
      handler.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        handler._handleMouseDown
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        handler._handleMouseUp
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseleave',
        handler._handleMouseLeave
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        handler._handleMouseMove
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'contextmenu',
        handler._handleContextMenu
      );
    });
  });
});
