import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UIManager } from '../src/renderer/api/ui-manager.js';
import { state, updateState, WAVEFORM_POINTS } from '../src/renderer/api/state.js';

// Mock DOM elements
const createMockElement = (id, type = 'div') => {
  const element = document.createElement(type);
  element.id = id;
  document.body.appendChild(element);
  return element;
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    openFile: vi.fn(),
    saveFile: vi.fn()
  },
  writable: true
});

describe('UIManager', () => {
  let uiManager;
  let mockCanvasDrawer;
  let mockMouseHandler;
  let mockDrawFunction;
  let elements;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';

    // Create mock elements
    elements = {
      canvas: createMockElement('waveform-canvas', 'canvas'),
      openBtn: createMockElement('open-btn', 'button'),
      saveBtn: createMockElement('save-btn', 'button'),
      resetBtn: createMockElement('reset-btn', 'button'),
      hZoomSlider: createMockElement('h-zoom', 'input'),
      vZoomSlider: createMockElement('v-zoom', 'input'),
      shiftLeftBtn: createMockElement('shift-left-btn', 'button'),
      shiftRightBtn: createMockElement('shift-right-btn', 'button'),
      shiftUpBtn: createMockElement('shift-up-btn', 'button'),
      shiftDownBtn: createMockElement('shift-down-btn', 'button'),
      drawStyleLine: createMockElement('draw-style-line', 'button'),
      drawStyleDots: createMockElement('draw-style-dots', 'button'),
      waveformTypeSelect: createMockElement('waveform-type', 'select'),
      amplitudeInput: createMockElement('amplitude', 'input'),
      minValueInput: createMockElement('min-value', 'input'),
      cyclesInput: createMockElement('cycles', 'input'),
      dutyCycleInput: createMockElement('duty-cycle', 'input'),
      generateWaveformBtn: createMockElement('generate-waveform-btn', 'button'),
      downloadDeviceBtn: createMockElement('download-device-btn', 'button'),
      zoomResetBtn: createMockElement('zoom-reset-btn', 'button')
    };

    // Configure mock elements
    elements.hZoomSlider.type = 'range';
    elements.hZoomSlider.min = '0.1';
    elements.hZoomSlider.max = '10';
    elements.hZoomSlider.value = '1';

    elements.vZoomSlider.type = 'range';
    elements.vZoomSlider.min = '0.1';
    elements.vZoomSlider.max = '10';
    elements.vZoomSlider.value = '1';

    // Set canvas dimensions for height-dependent calculations
    Object.defineProperty(elements.canvas, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(elements.canvas, 'clientWidth', { value: 400, configurable: true });

    // Draw style buttons use active class for state
    elements.drawStyleLine.classList.add('active');

    // Add edit mode toggle buttons
    createMockElement('edit-mode-freehand', 'button').classList.add('active');
    createMockElement('edit-mode-line', 'button');

    // Create mocks
    mockCanvasDrawer = {
      draw: vi.fn()
    };

    mockMouseHandler = {
      setEditMode: vi.fn(),
      destroy: vi.fn()
    };

    mockDrawFunction = vi.fn();

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

    uiManager = new UIManager(state, updateState, mockCanvasDrawer, mockMouseHandler, mockDrawFunction);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize all DOM elements', () => {
      uiManager.initializeElements();

      expect(uiManager.canvas).toBe(elements.canvas);
      expect(uiManager.openBtn).toBe(elements.openBtn);
      expect(uiManager.hZoomSlider).toBe(elements.hZoomSlider);
      // Add more assertions as needed
    });

    it('should set up event listeners', () => {
      const setupShiftListenersSpy = vi.spyOn(uiManager, 'setupShiftListeners');
      const setupZoomListenersSpy = vi.spyOn(uiManager, 'setupZoomListeners');
      const setupZoomResetListenerSpy = vi.spyOn(uiManager, 'setupZoomResetListener');
      const setupDrawStyleListenersSpy = vi.spyOn(uiManager, 'setupDrawStyleListeners');
      const setupEditModeListenersSpy = vi.spyOn(uiManager, 'setupEditModeListeners');
      const setupFileOperationListenersSpy = vi.spyOn(uiManager, 'setupFileOperationListeners');
      const setupWaveformGenerationListenersSpy = vi.spyOn(uiManager, 'setupWaveformGenerationListeners');
      const setupDeviceDownloadListenerSpy = vi.spyOn(uiManager, 'setupDeviceDownloadListener');

      // Initialize elements first
      uiManager.initializeElements();
      uiManager.setupEventListeners();

      expect(setupShiftListenersSpy).toHaveBeenCalled();
      expect(setupZoomListenersSpy).toHaveBeenCalled();
      expect(setupZoomResetListenerSpy).toHaveBeenCalled();
      expect(setupDrawStyleListenersSpy).toHaveBeenCalled();
      expect(setupEditModeListenersSpy).toHaveBeenCalled();
      expect(setupFileOperationListenersSpy).toHaveBeenCalled();
      expect(setupWaveformGenerationListenersSpy).toHaveBeenCalled();
      expect(setupDeviceDownloadListenerSpy).toHaveBeenCalled();
    });

    it('should initialize edit mode from state', () => {
      uiManager.initializeElements();
      uiManager.initializeEditMode();
      expect(state.editMode).toBe('freehand');
      expect(uiManager.editModeFreehand.classList.contains('active')).toBe(true);
      expect(uiManager.editModeLine.classList.contains('active')).toBe(false);
    });
  });

  describe('edit mode controls', () => {
    beforeEach(() => {
      uiManager.initializeElements();
      uiManager.setupEditModeListeners();
    });

    it('should set edit mode to freehand when freehand button is clicked', () => {
      // First switch to line mode
      updateState({ editMode: 'line' });
      uiManager.editModeLine.classList.add('active');
      uiManager.editModeFreehand.classList.remove('active');

      // Now click freehand button
      uiManager.editModeFreehand.click();

      expect(state.editMode).toBe('freehand');
      expect(uiManager.editModeFreehand.classList.contains('active')).toBe(true);
      expect(uiManager.editModeLine.classList.contains('active')).toBe(false);
      expect(mockMouseHandler.setEditMode).toHaveBeenCalledWith('freehand');
    });

    it('should set edit mode to line when line button is clicked', () => {
      uiManager.editModeLine.click();

      expect(state.editMode).toBe('line');
      expect(uiManager.editModeLine.classList.contains('active')).toBe(true);
      expect(uiManager.editModeFreehand.classList.contains('active')).toBe(false);
      expect(mockMouseHandler.setEditMode).toHaveBeenCalledWith('line');
    });
  });

  describe('shift controls', () => {
    beforeEach(() => {
      uiManager.initializeElements();
      uiManager.setupShiftListeners();
    });

    it('should shift left when left button is clicked', () => {
      const initialOffset = 100;
      updateState({ viewOffset: initialOffset });

      elements.shiftLeftBtn.click();

      expect(state.viewOffset).toBeLessThan(initialOffset);
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should shift right when right button is clicked', () => {
      const initialOffset = 0;
      updateState({ viewOffset: initialOffset });

      elements.shiftRightBtn.click();

      expect(state.viewOffset).toBeGreaterThanOrEqual(initialOffset);
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should shift up when up button is clicked', () => {
      const initialVShift = 0;
      updateState({ vShift: initialVShift });

      elements.shiftUpBtn.click();

      expect(state.vShift).toBeLessThanOrEqual(initialVShift);
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should shift down when down button is clicked', () => {
      const initialVShift = 0;
      updateState({ vShift: initialVShift });

      elements.shiftDownBtn.click();

      expect(state.vShift).toBeGreaterThanOrEqual(initialVShift);
      expect(mockDrawFunction).toHaveBeenCalled();
    });
  });

  describe('zoom controls', () => {
    beforeEach(() => {
      uiManager.initializeElements();
      uiManager.setupZoomListeners();
    });

    it('should update horizontal zoom when slider changes', () => {
      const newZoom = 2.0;
      elements.hZoomSlider.value = newZoom;
      elements.hZoomSlider.dispatchEvent(new Event('input'));

      expect(state.hZoom).toBe(newZoom);
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should update vertical zoom when slider changes', () => {
      const newZoom = 2.0;
      elements.vZoomSlider.value = newZoom;
      elements.vZoomSlider.dispatchEvent(new Event('input'));

      expect(state.vZoom).toBe(newZoom);
      expect(mockDrawFunction).toHaveBeenCalled();
    });
  });

  describe('zoom reset', () => {
    beforeEach(() => {
      uiManager.initializeElements();
      uiManager.setupZoomResetListener();
    });

    it('should reset hZoom to 1 when zoom reset button is clicked', () => {
      updateState({ hZoom: 5 });
      elements.hZoomSlider.value = '5';

      elements.zoomResetBtn.click();

      expect(state.hZoom).toBe(1);
      expect(elements.hZoomSlider.value).toBe('1');
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should reset vZoom to 1 when zoom reset button is clicked', () => {
      updateState({ vZoom: 5 });
      elements.vZoomSlider.value = '5';

      elements.zoomResetBtn.click();

      expect(state.vZoom).toBe(1);
      expect(elements.vZoomSlider.value).toBe('1');
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should reset viewOffset to 0 when zoom reset button is clicked', () => {
      updateState({ viewOffset: 100 });

      elements.zoomResetBtn.click();

      expect(state.viewOffset).toBe(0);
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should reset vShift to 0 when zoom reset button is clicked', () => {
      updateState({ vShift: 50 });

      elements.zoomResetBtn.click();

      expect(state.vShift).toBe(0);
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should preserve waveform data when zoom reset button is clicked', () => {
      const testData = new Float32Array(WAVEFORM_POINTS).fill(0.5);
      updateState({
        waveformData: testData,
        lastLoadedWaveformData: new Float32Array(testData)
      });

      elements.zoomResetBtn.click();

      expect(state.waveformData).toEqual(testData);
      expect(state.lastLoadedWaveformData).toEqual(testData);
    });
  });

  describe('draw style controls', () => {
    beforeEach(() => {
      uiManager.initializeElements();
      uiManager.setupDrawStyleListeners();
    });

    it('should set draw style to line when line button is clicked', () => {
      elements.drawStyleLine.click();

      expect(state.drawStyle).toBe('line');
      expect(mockDrawFunction).toHaveBeenCalled();
    });

    it('should set draw style to dots when dots button is clicked', () => {
      elements.drawStyleDots.click();

      expect(state.drawStyle).toBe('dots');
      expect(mockDrawFunction).toHaveBeenCalled();
    });
  });

  describe('initializeDrawStyle', () => {
    beforeEach(() => {
      uiManager.initializeElements();
    });

    it('should initialize line draw style when state is line', () => {
      updateState({ drawStyle: 'line' });
      uiManager.initializeDrawStyle();

      expect(uiManager.drawStyleLine.classList.contains('active')).toBe(true);
      expect(uiManager.drawStyleDots.classList.contains('active')).toBe(false);
    });

    it('should initialize dots draw style when state is dots', () => {
      updateState({ drawStyle: 'dots' });
      uiManager.initializeDrawStyle();

      expect(uiManager.drawStyleDots.classList.contains('active')).toBe(true);
      expect(uiManager.drawStyleLine.classList.contains('active')).toBe(false);
    });
  });

  describe('file operation listeners', () => {
    beforeEach(() => {
      uiManager.initializeElements();
      uiManager.setupFileOperationListeners();
    });

    it('should call window.electronAPI.saveFile when save button is clicked', async () => {
      const testData = new Float32Array([0.5, 0.6, 0.7]);
      updateState({ waveformData: testData });

      window.electronAPI.saveFile.mockResolvedValue(undefined);

      elements.saveBtn.click();

      // Wait for the async save to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
      // The data is converted from Float32Array to string
      const expectedDataString = Array.from(testData).join('\n');
      expect(window.electronAPI.saveFile).toHaveBeenCalledWith(expectedDataString);
    });

    it('should alert when file contains non-numeric values', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      window.electronAPI.openFile.mockResolvedValue('0.5\nabc\n0.7');

      elements.openBtn.click();

      // Wait for the async open to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('Error: File contains non-numeric values.');
      alertSpy.mockRestore();
    });

    it('should load file with valid numeric values', async () => {
      window.electronAPI.openFile.mockResolvedValue('0.1\n0.2\n0.3');

      elements.openBtn.click();

      // Wait for the async open to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that the waveform data was updated
      expect(state.waveformData[0]).toBeCloseTo(0.1, 5);
      expect(state.waveformData[1]).toBeCloseTo(0.2, 5);
      expect(state.waveformData[2]).toBeCloseTo(0.3, 5);
      expect(mockDrawFunction).toHaveBeenCalled();
    });
  });

  describe('waveform generation validation', () => {
    beforeEach(() => {
      // Add options to waveform type select
      elements.waveformTypeSelect.innerHTML = `
        <option value="sine">Sine</option>
        <option value="square">Square</option>
        <option value="triangle">Triangle</option>
        <option value="ramp">Ramp</option>
        <option value="ramp-down">Ramp Down</option>
        <option value="exponential">Exponential</option>
        <option value="exponential-down">Exponential Down</option>
        <option value="noise">Noise</option>
      `;
      uiManager.initializeElements();
      uiManager.setupWaveformGenerationListeners();
      // Set valid default values
      elements.waveformTypeSelect.value = 'sine';
      elements.amplitudeInput.value = '0.5';
      elements.minValueInput.value = '-0.5';
      elements.cyclesInput.value = '1';
      elements.dutyCycleInput.value = '50';
    });

    it('should alert when min value is less than -1', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.minValueInput.value = '-1.5';

      elements.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min value must be between -1 and 1.');
      expect(mockDrawFunction).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should alert when min value is greater than 1', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.minValueInput.value = '1.5';

      elements.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min value must be between -1 and 1.');
      expect(mockDrawFunction).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should alert when min is not less than max', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.amplitudeInput.value = '0.5';
      elements.minValueInput.value = '0.5';

      elements.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Min must be less than Max.');
      expect(mockDrawFunction).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should alert when cycles is less than 1', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.cyclesInput.value = '0';

      elements.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Cycles must be a positive integer.');
      expect(mockDrawFunction).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should alert when duty cycle is out of range for square wave', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.waveformTypeSelect.value = 'square';
      elements.amplitudeInput.value = '0.5';
      elements.minValueInput.value = '-0.5';
      elements.cyclesInput.value = '1';
      elements.dutyCycleInput.value = '150';

      elements.generateWaveformBtn.click();

      expect(alertSpy).toHaveBeenCalledWith('Duty Cycle must be between 0 and 100 for Square, Triangle, Ramp, and Exponential waves.');
      expect(mockDrawFunction).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should generate waveform with valid parameters', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // Ensure all values are valid
      elements.waveformTypeSelect.value = 'sine';
      elements.amplitudeInput.value = '0.5';
      elements.minValueInput.value = '-0.5';
      elements.cyclesInput.value = '1';

      elements.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockDrawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should generate noise waveform when noise type is selected', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // Set values for noise waveform (no cycles or dutyCycle needed)
      elements.waveformTypeSelect.value = 'noise';
      elements.amplitudeInput.value = '0.8';
      elements.minValueInput.value = '-0.8';
      // Noise doesn't use cycles, but we still need a valid value
      elements.cyclesInput.value = '1';

      elements.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockDrawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should generate ramp-up waveform when selected', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.waveformTypeSelect.value = 'ramp';
      elements.amplitudeInput.value = '0.8';
      elements.minValueInput.value = '-0.8';
      elements.cyclesInput.value = '2';
      elements.dutyCycleInput.value = '50';

      elements.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockDrawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should generate ramp-down waveform when selected', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.waveformTypeSelect.value = 'ramp-down';
      elements.amplitudeInput.value = '0.8';
      elements.minValueInput.value = '-0.8';
      elements.cyclesInput.value = '2';
      elements.dutyCycleInput.value = '50';

      elements.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockDrawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should generate exponential-up waveform when selected', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.waveformTypeSelect.value = 'exponential';
      elements.amplitudeInput.value = '0.8';
      elements.minValueInput.value = '-0.8';
      elements.cyclesInput.value = '2';
      elements.dutyCycleInput.value = '50';

      elements.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockDrawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should generate exponential-down waveform when selected', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      elements.waveformTypeSelect.value = 'exponential-down';
      elements.amplitudeInput.value = '0.8';
      elements.minValueInput.value = '-0.8';
      elements.cyclesInput.value = '2';
      elements.dutyCycleInput.value = '50';

      elements.generateWaveformBtn.click();

      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockDrawFunction).toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('mouse handler callbacks', () => {
    beforeEach(() => {
      uiManager.initializeElements();
    });

    it('should provide proper updateState callback with view offset clamping', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();
      const maxOffset = WAVEFORM_POINTS - (WAVEFORM_POINTS / state.hZoom);

      // Test view offset clamping
      callbacks.updateState({ viewOffset: -100 });
      expect(state.viewOffset).toBe(0);

      callbacks.updateState({ viewOffset: maxOffset + 100 });
      expect(state.viewOffset).toBe(maxOffset);
    });

    it('should provide proper updateState callback with vShift clamping', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();
      const chartHeight = elements.canvas.clientHeight - (20 + 30); // TOP_PADDING + BOTTOM_PADDING
      const maxPixelShift = (chartHeight / 2) * (state.vZoom - 1);

      // Test vShift clamping
      callbacks.updateState({ vShift: -maxPixelShift - 100 });
      expect(state.vShift).toBe(-maxPixelShift);

      callbacks.updateState({ vShift: maxPixelShift + 100 });
      expect(state.vShift).toBe(maxPixelShift);
    });

    it('should provide proper updateZoom callback', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();

      callbacks.updateZoom('h', 2.5);
      expect(elements.hZoomSlider.value).toBe('2.5');

      callbacks.updateZoom('v', 1.5);
      expect(elements.vZoomSlider.value).toBe('1.5');
    });

    it('should handle vShift update when canvas is null', () => {
      // Set canvas to null
      uiManager.canvas = null;
      const callbacks = uiManager.getMouseHandlerCallbacks();

      // Should not throw and should pass through vShift
      callbacks.updateState({ vShift: 50 });
      expect(state.vShift).toBe(50);
    });

    it('should handle updateZoom when hZoomSlider is null', () => {
      uiManager.hZoomSlider = null;
      const callbacks = uiManager.getMouseHandlerCallbacks();

      // Should not throw, just return early
      expect(() => callbacks.updateZoom('h', 2.5)).not.toThrow();
    });

    it('should handle updateZoom when vZoomSlider is null', () => {
      uiManager.vZoomSlider = null;
      const callbacks = uiManager.getMouseHandlerCallbacks();

      // Should not throw, just return early
      expect(() => callbacks.updateZoom('v', 2.5)).not.toThrow();
    });

    it('should clamp zoom values to slider min/max', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();

      // Try to set zoom below minimum
      callbacks.updateZoom('h', 0.05); // Below min of 0.1
      expect(parseFloat(elements.hZoomSlider.value)).toBe(0.1);

      // Try to set zoom above maximum
      callbacks.updateZoom('v', 15); // Above max of 10
      expect(parseFloat(elements.vZoomSlider.value)).toBe(10);
    });

    it('should pass through waveformData unchanged in updateState callback', () => {
      const callbacks = uiManager.getMouseHandlerCallbacks();
      const testData = new Float32Array(WAVEFORM_POINTS).fill(0.5);

      callbacks.updateState({ waveformData: testData });

      expect(state.waveformData).toEqual(testData);
    });
  });

  describe('Other UI interactions', () => {
    beforeEach(() => {
      uiManager.initializeElements();
    });

    it('should show alert when download to device is clicked', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      uiManager.setupDeviceDownloadListener();
      elements.downloadDeviceBtn.click();
      expect(alertSpy).toHaveBeenCalledWith('Downloading to device is not yet implemented.');
      alertSpy.mockRestore();
    });

    it('should destroy listeners and handlers', () => {
      const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
      const mouseHandlerDestroySpy = vi.spyOn(mockMouseHandler, 'destroy');
      uiManager.destroy();
      expect(removeListenerSpy).toHaveBeenCalledWith('resize', mockDrawFunction);
      expect(mouseHandlerDestroySpy).toHaveBeenCalled();
    });

    it('should fallback to freehand mode if state is invalid', () => {
      // Set invalid edit mode
      updateState({ editMode: 'invalid' });
      uiManager.initializeEditMode();
      // When state is not 'freehand', line mode should be active
      expect(uiManager.editModeLine.classList.contains('active')).toBe(true);
      expect(uiManager.editModeFreehand.classList.contains('active')).toBe(false);
    });
  });
});
