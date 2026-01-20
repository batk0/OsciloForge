import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { CanvasDrawer } from '../src/js/canvas-drawer.js';

// Mock getNiceTickInterval
vi.mock('../src/js/utils.js', () => ({
    getNiceTickInterval: vi.fn((range, ticks) => range / ticks),
}));


describe('CanvasDrawer', () => {
    let canvas;
    let drawer;
    let dom;

    beforeEach(() => {
        dom = new JSDOM(`<!DOCTYPE html><canvas id="waveform-canvas" style="width: 800px; height: 600px;"></canvas>`);
        global.window = dom.window;
        global.document = dom.window.document;
        
        canvas = document.getElementById('waveform-canvas');
        
        // JSDOM does not have clientWidth/clientHeight, so we need to set them manually
        Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
        Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
        
        drawer = new CanvasDrawer(canvas, { WAVEFORM_POINTS: 4096 });
    });

    it('should be instantiated', () => {
        expect(drawer).toBeInstanceOf(CanvasDrawer);
    });

    it('should have a canvas and context', () => {
        expect(drawer.canvas).toBeDefined();
        expect(drawer.ctx).toBeDefined();
    });

    it('draw function should not throw an error with default state', () => {
        const state = {
            waveformData: new Float32Array(4096).fill(0),
            hZoom: 1,
            vZoom: 1,
            viewOffset: 0,
            vShift: 0,
            drawStyle: 'line',
        };
        expect(() => drawer.draw(state)).not.toThrow();
    });

    it('should call clearRect on draw', () => {
        const state = {
            waveformData: new Float32Array(4096).fill(0), hZoom: 1, vZoom: 1, viewOffset: 0, vShift: 0, drawStyle: 'line'
        };
        const clearRectSpy = vi.spyOn(drawer.ctx, 'clearRect');
        drawer.draw(state);
        expect(clearRectSpy).toHaveBeenCalled();
        expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should not draw if canvas size is too small', () => {
        Object.defineProperty(canvas, 'clientWidth', { value: 50, configurable: true });
        Object.defineProperty(canvas, 'clientHeight', { value: 50, configurable: true });
         const state = {
            waveformData: new Float32Array(4096).fill(0), hZoom: 1, vZoom: 1, viewOffset: 0, vShift: 0, drawStyle: 'line'
        };
        const clearRectSpy = vi.spyOn(drawer.ctx, 'clearRect');
        drawer.draw(state);
        expect(clearRectSpy).not.toHaveBeenCalled();
    });
});
