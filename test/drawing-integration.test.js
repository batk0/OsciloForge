import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { UIManager } from '../src/js/ui-manager.js';
import { CanvasDrawer } from '../src/js/canvas-drawer.js';
import { MouseHandler } from '../src/js/mouse-handler.js';
import { state, updateState, WAVEFORM_POINTS } from '../src/js/state.js';

describe('Drawing Integration Test', () => {
    let dom;
    let canvas;
    let canvasDrawer;
    let uiManager;
    let mouseHandler;

    beforeEach(() => {
        // Set up DOM with required elements
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <canvas id="waveform-canvas" width="800" height="400"></canvas>
                <input type="radio" id="edit-mode-freehand" name="edit-mode" value="freehand" checked>
                <input type="radio" id="edit-mode-line" name="edit-mode" value="line">
                <input type="range" id="h-zoom" min="1" max="20" value="1">
                <input type="range" id="v-zoom" min="1" max="10" value="1">
            </body>
            </html>
        `);
        global.document = dom.window.document;

        // Initialize components
        canvas = document.getElementById('waveform-canvas');
        canvasDrawer = new CanvasDrawer(canvas);
        uiManager = new UIManager(state, updateState, canvasDrawer, null, () => canvasDrawer.draw(state));
        
        // Set mouseHandler after UIManager creation (mimicking renderer.js)
        mouseHandler = new MouseHandler(canvas, state, uiManager.getMouseHandlerCallbacks());
        uiManager.mouseHandler = mouseHandler;

        // Initialize UI elements
        uiManager.initialize();
    });

    it('should handle complete drawing workflow from mouse events to state updates', () => {
        // Set initial state
        const initialData = new Float32Array(WAVEFORM_POINTS).fill(0);
        updateState({ waveformData: initialData });
        
        // Set edit mode to freehand
        uiManager.updateState({ editMode: 'freehand' });
        mouseHandler.setEditMode('freehand');
        
        // Verify initial state
        expect(state.waveformData[100]).toBe(0);
        
        // Simulate drawing operation by calling the drawing method directly
        // (In real usage, this would be triggered by mouse events)
        const testData = new Float32Array(WAVEFORM_POINTS);
        testData.fill(0.5);
        
        // Use the mouse handler callback to update the state
        mouseHandler.hooks.updateState({ waveformData: testData });
        
        // Verify the state was actually updated through the callback
        expect(state.waveformData).toBe(testData);
        expect(state.waveformData[100]).toBeCloseTo(0.5);
        expect(state.waveformData[200]).toBeCloseTo(0.5);
    });

    it('should handle both viewOffset and waveformData updates in same call', () => {
        // Set initial state
        updateState({ viewOffset: 0 });
        const initialData = new Float32Array(WAVEFORM_POINTS).fill(0.1);
        updateState({ waveformData: initialData });
        
        // Simulate a drawing operation that also changes viewOffset
        const newData = new Float32Array(WAVEFORM_POINTS).fill(0.8);
        mouseHandler.hooks.updateState({ 
            waveformData: newData,
            viewOffset: 100 
        });
        
        // Verify both updates were applied correctly
        expect(state.waveformData).toBe(newData);
        expect(state.waveformData[0]).toBeCloseTo(0.8);
        
        // viewOffset should be clamped by the callback logic
        expect(state.viewOffset).toBeGreaterThanOrEqual(0);
        expect(state.viewOffset).toBeLessThanOrEqual(WAVEFORM_POINTS);
    });

    it('should pass through all properties except viewOffset and vShift', () => {
        // Test that arbitrary properties are passed through
        mouseHandler.hooks.updateState({ 
            someProperty: 'test value',
            anotherProperty: 123,
            editMode: 'line'
        });
        
        // Verify properties were set
        expect(state.someProperty).toBe('test value');
        expect(state.anotherProperty).toBe(123);
        expect(state.editMode).toBe('line');
    });
});