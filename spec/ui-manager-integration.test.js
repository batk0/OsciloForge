import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from '../src/renderer/api/ui-manager.js';
import { CanvasDrawer } from '../src/renderer/api/canvas-drawer.js';
import { MouseHandler } from '../src/renderer/api/mouse-handler.js';
import { state, updateState, WAVEFORM_POINTS } from '../src/renderer/api/state.js';

describe('UIManager Integration', () => {
  let uiManager;
  let canvasDrawer;
  let mouseHandler;
  let mockCanvas;
  let drawFunction;

  // Mock DOM elements
  const createMockElement = (id, type = 'div') => {
    const element = document.createElement(type);
    element.id = id;
    document.body.appendChild(element);
    return element;
  };

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';

    // Create all required elements for a complete test
    mockCanvas = createMockElement('waveform-canvas', 'canvas');
    createMockElement('open-btn', 'button');
    createMockElement('save-btn', 'button');
    createMockElement('reset-btn', 'button');

    const hZoomSlider = createMockElement('h-zoom', 'input');
    hZoomSlider.type = 'range';
    hZoomSlider.min = '0.1';
    hZoomSlider.max = '10';
    hZoomSlider.value = '1';

    const vZoomSlider = createMockElement('v-zoom', 'input');
    vZoomSlider.type = 'range';
    vZoomSlider.min = '0.1';
    vZoomSlider.max = '10';
    vZoomSlider.value = '1';

    createMockElement('shift-left-btn', 'button');
    createMockElement('shift-right-btn', 'button');
    createMockElement('shift-up-btn', 'button');
    createMockElement('shift-down-btn', 'button');

    const drawStyleLine = createMockElement('draw-style-line', 'input');
    drawStyleLine.type = 'radio';
    drawStyleLine.name = 'draw-style';
    drawStyleLine.checked = true;

    const drawStyleDots = createMockElement('draw-style-dots', 'input');
    drawStyleDots.type = 'radio';
    drawStyleDots.name = 'draw-style';

    const waveformTypeSelect = createMockElement('waveform-type', 'select');
    waveformTypeSelect.innerHTML = `
      <option value="sine">Sine</option>
      <option value="square">Square</option>
      <option value="triangle">Triangle</option>
    `;
    createMockElement('amplitude', 'input');
    createMockElement('min-value', 'input');
    createMockElement('cycles', 'input');
    createMockElement('duty-cycle', 'input');
    createMockElement('generate-waveform-btn', 'button');
    createMockElement('download-device-btn', 'button');

    // Add edit mode radio buttons
    const freehandRadio = document.createElement('input');
    freehandRadio.type = 'radio';
    freehandRadio.name = 'edit-mode';
    freehandRadio.value = 'freehand';
    freehandRadio.checked = true;
    document.body.appendChild(freehandRadio);

    const lineRadio = document.createElement('input');
    lineRadio.type = 'radio';
    lineRadio.name = 'edit-mode';
    lineRadio.value = 'line';
    document.body.appendChild(lineRadio);

    // Set canvas dimensions
    Object.defineProperty(mockCanvas, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(mockCanvas, 'clientWidth', { value: 600, configurable: true });

    // Mock window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: {
        openFile: vi.fn(),
        saveFile: vi.fn()
      },
      writable: true
    });

    // Create canvas drawer
    canvasDrawer = new CanvasDrawer(mockCanvas);

    // Create draw function
    drawFunction = vi.fn(() => canvasDrawer.draw(state));

    // Reset state
    updateState({
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
      lastLoadedWaveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'line',
      editMode: 'freehand'
    });

    // Create UI manager
    uiManager = new UIManager(state, updateState, canvasDrawer, null, drawFunction);

    // Initialize UI manager
    uiManager.initialize();

    // Create mouse handler with callbacks from UI manager
    mouseHandler = new MouseHandler(mockCanvas, state, uiManager.getMouseHandlerCallbacks());

    // Update UI manager with mouse handler
    uiManager.mouseHandler = mouseHandler;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Complete Integration', () => {
    it('should initialize the complete UI system', () => {
      expect(uiManager.canvas).toBe(mockCanvas);
      expect(uiManager.hZoomSlider).toBeTruthy();
      expect(uiManager.vZoomSlider).toBeTruthy();
      expect(mouseHandler).toBeTruthy();
    });

    it('should handle zoom changes through UI and update state', () => {
      const initialHZoom = state.hZoom;

      uiManager.hZoomSlider.value = '2.5';
      uiManager.hZoomSlider.dispatchEvent(new Event('input'));

      expect(state.hZoom).toBe(2.5);
      expect(state.hZoom).not.toBe(initialHZoom);
      expect(drawFunction).toHaveBeenCalled();
    });

    it('should handle style changes and update state', () => {
      uiManager.drawStyleDots.checked = true;
      uiManager.drawStyleDots.dispatchEvent(new Event('change'));

      expect(state.drawStyle).toBe('dots');
      expect(drawFunction).toHaveBeenCalled();
    });

    it('should provide proper mouse handler callbacks for zoom', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();

      callbacks.updateZoom('h', 3.0);
      expect(uiManager.hZoomSlider.value).toBe('3'); // DOM values are strings, no trailing zero

      callbacks.updateZoom('v', 2.0);
      expect(uiManager.vZoomSlider.value).toBe('2'); // DOM values are strings, no trailing zero
    });

    it('should provide proper mouse handler callbacks for state updates', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();

      // The viewOffset is clamped based on visible points, so let's test with a reasonable value
      callbacks.updateState({ viewOffset: 100 });
      expect(state.viewOffset).toBeGreaterThanOrEqual(0);

      // Set vZoom first to allow vShift, then test vShift
      updateState({ vZoom: 2.0 });
      callbacks.updateState({ vShift: 50 });
      expect(state.vShift).toBe(50);
    });

    it('should handle shift controls', () => {
      const initialOffset = state.viewOffset;

      // Test shift right - should increase offset or clamp to max
      uiManager.shiftRightBtn.click();
      expect(state.viewOffset).toBeGreaterThanOrEqual(initialOffset);
      expect(drawFunction).toHaveBeenCalled();

      // Test shift left - should decrease offset or clamp to 0
      uiManager.shiftLeftBtn.click();
      expect(state.viewOffset).toBeGreaterThanOrEqual(0);
      expect(drawFunction).toHaveBeenCalled();
    });

    it('should handle edit mode changes', () => {
      const lineRadio = document.querySelector('input[name="edit-mode"][value="line"]');
      const setEditModeSpy = vi.spyOn(mouseHandler, 'setEditMode');

      lineRadio.checked = true;
      lineRadio.dispatchEvent(new Event('change'));

      expect(state.editMode).toBe('line');
      expect(setEditModeSpy).toHaveBeenCalledWith('line');
    });

    it('should handle reset functionality', () => {
      // Change some state first
      updateState({ hZoom: 2.0, vZoom: 1.5, viewOffset: 100 });

      uiManager.resetBtn.click();

      expect(state.hZoom).toBe(1);
      expect(state.vZoom).toBe(1);
      expect(state.viewOffset).toBe(0);
      expect(uiManager.hZoomSlider.value).toBe('1');
      expect(uiManager.vZoomSlider.value).toBe('1');
      expect(drawFunction).toHaveBeenCalled();
    });

    it('should handle file operations correctly', async () => {
      const mockFileContent = '0.5\n-0.5\n0.3\n-0.3';
      window.electronAPI.openFile.mockResolvedValue(mockFileContent);

      uiManager.openBtn.click();
      await Promise.resolve();

      expect(window.electronAPI.openFile).toHaveBeenCalled();
      expect(drawFunction).toHaveBeenCalled();

      // Should reset zoom on new file
      expect(state.hZoom).toBe(1);
      expect(state.vZoom).toBe(1);
      expect(state.viewOffset).toBe(0);
    });

    it('should validate waveform generation inputs', async () => {
      // Set invalid max value
      uiManager.amplitudeInput.value = '2.0'; // Invalid ( > 1.0 )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Max value must be between -1 and 1.');

      alertSpy.mockRestore();
    });

    it('should validate min value less than -1', () => {
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-1.5'; // Invalid ( < -1 )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min value must be between -1 and 1.');
      alertSpy.mockRestore();
    });

    it('should validate min value greater than 1', () => {
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '1.5'; // Invalid ( > 1 )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min value must be between -1 and 1.');
      alertSpy.mockRestore();
    });

    it('should validate min value not less than max', () => {
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '0.5'; // Invalid ( min >= max )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min must be less than Max.');
      alertSpy.mockRestore();
    });

    it('should validate min greater than max', () => {
      uiManager.amplitudeInput.value = '-0.5';
      uiManager.minValueInput.value = '0.5'; // Invalid ( min > max )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min must be less than Max.');
      alertSpy.mockRestore();
    });

    it('should validate cycles is a positive integer', () => {
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '0'; // Invalid ( < 1 )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Cycles must be a positive integer.');
      alertSpy.mockRestore();
    });

    it('should validate cycles is not NaN', () => {
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = 'invalid'; // Invalid ( NaN )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Cycles must be a positive integer.');
      alertSpy.mockRestore();
    });

    it('should validate duty cycle for square waves', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // Must set values in DOM elements before uiManager reads them
      uiManager.waveformTypeSelect.value = 'square';
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '1';
      uiManager.dutyCycleInput.value = '150'; // Invalid ( > 100 )

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Duty Cycle must be between 0 and 100 for Square waves.');
      alertSpy.mockRestore();
    });

    it('should validate duty cycle is not negative for square waves', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // Must set values in DOM elements before uiManager reads them
      uiManager.waveformTypeSelect.value = 'square';
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '1';
      uiManager.dutyCycleInput.value = '-10'; // Invalid ( < 0 )

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Duty Cycle must be between 0 and 100 for Square waves.');
      alertSpy.mockRestore();
    });

    it('should validate max value less than -1', () => {
      uiManager.amplitudeInput.value = '-1.5'; // Invalid ( < -1 )
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Max value must be between -1 and 1.');
      alertSpy.mockRestore();
    });

    it('should successfully generate sine wave with valid min/max', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // Set up initial state with zeros
      const initialData = new Float32Array(WAVEFORM_POINTS).fill(0.0);
      updateState({
        waveformData: new Float32Array(initialData),
        lastLoadedWaveformData: new Float32Array(initialData)
      });

      uiManager.waveformTypeSelect.value = 'sine';
      uiManager.amplitudeInput.value = '0.8';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '2';

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(drawFunction).toHaveBeenCalled();
      // Verify waveform data was updated (check that at least one value is non-zero)
      const hasNonZero = state.waveformData.some(v => v !== 0);
      expect(hasNonZero).toBe(true);
      alertSpy.mockRestore();
    });

    it('should successfully generate square wave with valid min/max', () => {
      uiManager.waveformTypeSelect.value = 'square';
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '1';
      uiManager.dutyCycleInput.value = '50';
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(drawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should successfully generate triangle wave with valid min/max', () => {
      uiManager.waveformTypeSelect.value = 'triangle';
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '1';
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(drawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should handle invalid waveform type gracefully', () => {
      uiManager.waveformTypeSelect.value = 'invalid-type';
      uiManager.amplitudeInput.value = '0.5';
      uiManager.minValueInput.value = '-0.5';
      uiManager.cyclesInput.value = '1';
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      uiManager.generateWaveformBtn.click();

      // Should not generate anything or throw, just return early
      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should integrate properly with the drawing system', () => {
      // Test that the draw function is properly connected
      const drawSpy = vi.spyOn(canvasDrawer, 'draw');

      // Trigger a redraw
      uiManager.draw();

      expect(drawSpy).toHaveBeenCalledWith(state);
    });

    it('should use the current draw function even if initialized with a different one (regression test)', () => {
      // 1. Initialize UIManager with a dummy draw function
      const initialDrawFn = vi.fn();
      // We create a new instance to isolate this test case
      const localUiManager = new UIManager(state, updateState, canvasDrawer, null, initialDrawFn);

      // 2. Get callbacks (simulating MouseHandler initialization)
      const callbacks = localUiManager.getMouseHandlerCallbacks();

      // 3. Update UIManager's draw function LATER (mimicking renderer.js setup)
      const newDrawFn = vi.fn();
      localUiManager.draw = newDrawFn;

      // 4. Verify that calling the callback calls the NEW draw function
      callbacks.draw();

      expect(newDrawFn).toHaveBeenCalled();
      expect(initialDrawFn).not.toHaveBeenCalled();
    });
  });
});
