import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { CanvasDrawer } from '../src/renderer/api/canvas-drawer.js';
import { WAVEFORM_POINTS } from '../src/renderer/api/state.js';

// Mock getNiceTickInterval
vi.mock('../src/renderer/api/utils.js', () => ({
  getNiceTickInterval: vi.fn((range, ticks) => range / ticks)
}));

describe('CanvasDrawer', () => {
  let canvas;
  let drawer;
  let dom;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><canvas id="waveform-canvas" style="width: 800px; height: 600px;"></canvas>');
    global.window = dom.window;
    global.document = dom.window.document;

    canvas = document.getElementById('waveform-canvas');

    // JSDOM does not have clientWidth/clientHeight, so we need to set them manually
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });

    drawer = new CanvasDrawer(canvas);
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
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'line'
    };
    expect(() => drawer.draw(state)).not.toThrow();
  });

  it('should call clearRect on draw', () => {
    const state = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0), hZoom: 1, vZoom: 1, viewOffset: 0, vShift: 0, drawStyle: 'line'
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
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0), hZoom: 1, vZoom: 1, viewOffset: 0, vShift: 0, drawStyle: 'line'
    };
    const clearRectSpy = vi.spyOn(drawer.ctx, 'clearRect');
    drawer.draw(state);
    expect(clearRectSpy).not.toHaveBeenCalled();
  });

  it('should handle dots drawing style', () => {
    const state = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.5),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'dots'
    };
    const fillRectSpy = vi.spyOn(drawer.ctx, 'fillRect');
    drawer.draw(state);
    expect(fillRectSpy).toHaveBeenCalled();
  });

  it('should handle zoom and pan parameters correctly', () => {
    const state = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.25),
      hZoom: 2,
      vZoom: 1.5,
      viewOffset: 100,
      vShift: -0.1,
      drawStyle: 'line'
    };
    const clearRectSpy = vi.spyOn(drawer.ctx, 'clearRect');
    expect(() => drawer.draw(state)).not.toThrow();
    expect(clearRectSpy).toHaveBeenCalled();
  });

  it('should handle empty waveformData', () => {
    const state = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'line'
    };
    expect(() => drawer.draw(state)).not.toThrow();
  });

  it('should draw dots when drawStyle is "dots"', () => {
    const state = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.5),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'dots'
    };
    const fillRectSpy = vi.spyOn(drawer.ctx, 'fillRect');
    drawer.draw(state);
    expect(fillRectSpy).toHaveBeenCalled();

    // Test with an offset to ensure the x bounds check is hit
    state.viewOffset = WAVEFORM_POINTS - 10;
    drawer.draw(state);
    expect(fillRectSpy).toHaveBeenCalled();

    // Test with a zoom level that makes some points outside the view
    state.hZoom = 2;
    state.viewOffset = 10;
    drawer.draw(state);
    expect(fillRectSpy).toHaveBeenCalled();
  });

  describe('Error Handling', () => {
    it('should throw an error if 2D context is not available', () => {
      vi.spyOn(canvas, 'getContext').mockReturnValue(null);
      expect(() => new CanvasDrawer(canvas)).toThrow('2D context not available');
    });

    it('should not throw in draw method if context is missing', () => {
      const state = {
        waveformData: new Float32Array(WAVEFORM_POINTS).fill(0), hZoom: 1, vZoom: 1, viewOffset: 0, vShift: 0, drawStyle: 'line'
      };
      drawer.ctx = null; // Manually set context to null
      expect(() => drawer.draw(state)).not.toThrow();
    });

    it('should not throw in drawAxesAndGrid method if context is missing', () => {
      drawer.ctx = null; // Manually set context to null
      expect(() => drawer.drawAxesAndGrid(500, 300, 1, 1, 0, 0)).not.toThrow();
    });
  });
});
