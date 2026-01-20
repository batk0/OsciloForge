import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { MouseHandler } from '../src/js/mouse-handler.js';

vi.mock('../src/js/utils.js', () => ({
    getMousePos: vi.fn(() => ({ x: 0, y: 0 })),
}));

describe('MouseHandler', () => {
    let canvas;
    let state;
    let hooks;
    let handler;
    let dom;

    beforeEach(() => {
        dom = new JSDOM(`<!DOCTYPE html><canvas id="waveform-canvas"></canvas>`);
        global.document = dom.window.document;
        canvas = document.getElementById('waveform-canvas');
        
        state = {
            waveformData: new Float32Array(4096).fill(0),
            hZoom: 1,
            vZoom: 1,
            viewOffset: 0,
            vShift: 0,
            editMode: 'freehand',
            WAVEFORM_POINTS: 4096,
            TOP_PADDING: 20,
            RIGHT_PADDING: 20,
            BOTTOM_PADDING: 30,
            LEFT_PADDING: 50,
        };

        hooks = {
            updateState: vi.fn(),
            updateZoom: vi.fn(),
            draw: vi.fn(),
        };

        handler = new MouseHandler(canvas, state, hooks);
    });

    it('should be instantiated', () => {
        expect(handler).toBeInstanceOf(MouseHandler);
    });

    it('should add event listeners to the canvas', () => {
        const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');
        handler.init();
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('setEditMode should update editMode and reset drawing state', () => {
        handler.setEditMode('line');
        expect(handler.state.editMode).toBe('line');
        expect(handler.lineStartPoint).toBeNull();
        expect(handler.isDrawing).toBe(false);
        expect(handler.lastPoint).toEqual({ x: -1, y: -1 });
    });
});
