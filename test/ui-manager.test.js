import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UIManager } from '../src/js/ui-manager.js';
import { state, updateState, WAVEFORM_POINTS } from '../src/js/state.js';
import { CanvasDrawer } from '../src/js/canvas-drawer.js';
import { MouseHandler } from '../src/js/mouse-handler.js';

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
        saveFile: vi.fn(),
    },
    writable: true,
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
            drawStyleLine: createMockElement('draw-style-line', 'input'),
            drawStyleDots: createMockElement('draw-style-dots', 'input'),
            waveformTypeSelect: createMockElement('waveform-type', 'select'),
            amplitudeInput: createMockElement('amplitude', 'input'),
            cyclesInput: createMockElement('cycles', 'input'),
            dutyCycleInput: createMockElement('duty-cycle', 'input'),
            generateWaveformBtn: createMockElement('generate-waveform-btn', 'button'),
            downloadDeviceBtn: createMockElement('download-device-btn', 'button'),
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

        elements.drawStyleLine.type = 'radio';
        elements.drawStyleLine.name = 'draw-style';
        elements.drawStyleLine.checked = true;
        
        elements.drawStyleDots.type = 'radio';
        elements.drawStyleDots.name = 'draw-style';

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

        // Create mocks
        mockCanvasDrawer = {
            draw: vi.fn(),
        };

        mockMouseHandler = {
            setEditMode: vi.fn(),
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
            editMode: 'freehand',
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
            expect(setupDrawStyleListenersSpy).toHaveBeenCalled();
            expect(setupEditModeListenersSpy).toHaveBeenCalled();
            expect(setupFileOperationListenersSpy).toHaveBeenCalled();
            expect(setupWaveformGenerationListenersSpy).toHaveBeenCalled();
            expect(setupDeviceDownloadListenerSpy).toHaveBeenCalled();
        });

        it('should initialize edit mode from DOM', () => {
            uiManager.initializeEditMode();
            expect(state.editMode).toBe('freehand');
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

    describe('draw style controls', () => {
        beforeEach(() => {
            uiManager.initializeElements();
            uiManager.setupDrawStyleListeners();
        });

        it('should set draw style to line when line radio is changed', () => {
            elements.drawStyleLine.checked = true;
            elements.drawStyleLine.dispatchEvent(new Event('change'));
            
            expect(state.drawStyle).toBe('line');
            expect(mockDrawFunction).toHaveBeenCalled();
        });

        it('should set draw style to dots when dots radio is changed', () => {
            elements.drawStyleDots.checked = true;
            elements.drawStyleDots.dispatchEvent(new Event('change'));
            
            expect(state.drawStyle).toBe('dots');
            expect(mockDrawFunction).toHaveBeenCalled();
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
    });
});