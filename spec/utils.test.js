import { describe, it, expect } from 'vitest';
import { getNiceTickInterval, getMousePos } from '../src/renderer/api/utils.js';

describe('getNiceTickInterval', () => {
  it('should return 1 for roughInterval < 1.5 (normalized < 1.5)', () => {
    expect(getNiceTickInterval(1.4, 1)).toBe(1);
    expect(getNiceTickInterval(0.14, 1)).toBe(0.1);
  });

  it('should return 2 for roughInterval >= 1.5 and < 2.2 (normalized < 2.2)', () => {
    expect(getNiceTickInterval(1.5, 1)).toBe(2);
    expect(getNiceTickInterval(2.1, 1)).toBe(2);
    expect(getNiceTickInterval(0.21, 1)).toBe(0.2);
  });

  it('should return 2.5 for roughInterval >= 2.2 and < 3.5 (normalized < 3.5)', () => {
    expect(getNiceTickInterval(2.2, 1)).toBe(2.5);
    expect(getNiceTickInterval(3.4, 1)).toBe(2.5);
    expect(getNiceTickInterval(0.34, 1)).toBe(0.25);
  });

  it('should return 5 for roughInterval >= 3.5 and < 7.5 (normalized < 7.5)', () => {
    expect(getNiceTickInterval(3.5, 1)).toBe(5);
    expect(getNiceTickInterval(7.4, 1)).toBe(5);
    expect(getNiceTickInterval(0.74, 1)).toBe(0.5);
  });

  it('should return 10 for roughInterval >= 7.5 (normalized >= 7.5)', () => {
    expect(getNiceTickInterval(7.5, 1)).toBe(10);
    expect(getNiceTickInterval(11, 1)).toBe(10);
    expect(getNiceTickInterval(10, 1)).toBe(10);
    expect(getNiceTickInterval(1.1, 10)).toBe(0.1);
  });

  it('should handle various ranges and maxTicks', () => {
    expect(getNiceTickInterval(100, 10)).toBe(10);
    expect(getNiceTickInterval(90, 10)).toBe(10);
    expect(getNiceTickInterval(200, 8)).toBe(25);
    expect(getNiceTickInterval(110, 10)).toBe(10);
    expect(getNiceTickInterval(400, 8)).toBe(50);
    expect(getNiceTickInterval(1.9, 1)).toBe(2);
    expect(getNiceTickInterval(0.24, 1)).toBe(0.25);
    expect(getNiceTickInterval(0.05, 10)).toBe(0.005);
  });
});

describe('getMousePos', () => {
  it('should return correct mouse coordinates relative to the canvas', () => {
    const mockCanvas = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 50
      })
    };

    const mockEvent = {
      clientX: 250,
      clientY: 150
    };

    const pos = getMousePos(mockEvent, mockCanvas);
    expect(pos).toEqual({ x: 150, y: 100 });
  });

  it('should handle zero offsets correctly', () => {
    const mockCanvas = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0
      })
    };

    const mockEvent = {
      clientX: 50,
      clientY: 75
    };

    const pos = getMousePos(mockEvent, mockCanvas);
    expect(pos).toEqual({ x: 50, y: 75 });
  });
});
