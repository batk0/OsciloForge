import { describe, it, expect } from 'vitest';
import { generateSineWave, generateSquareWave, generateTriangleWave } from '../src/renderer/api/waveform-generator';
import { WAVEFORM_POINTS } from '../src/renderer/api/state.js';

describe('Waveform Generator', () => {
  it('generateSineWave should return a Float32Array of correct length with sine wave data', () => {
    const amplitude = 0.5;
    const cycles = 2;

    const result = generateSineWave(amplitude, cycles, WAVEFORM_POINTS);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(WAVEFORM_POINTS);

    // Check a few points
    // At 0, sine wave should be 0
    expect(result[0]).toBeCloseTo(0);
    // At WAVEFORM_POINTS / 4, sine wave should be at its peak for 1 cycle
    // For 2 cycles, it will be at peak at WAVEFORM_POINTS / 8
    expect(result[WAVEFORM_POINTS / (4 * cycles)]).toBeCloseTo(amplitude);
    // At WAVEFORM_POINTS / 2, sine wave should be 0 for 1 cycle
    // For 2 cycles, it will be 0 at WAVEFORM_POINTS / 4
    expect(result[WAVEFORM_POINTS / (2 * cycles)]).toBeCloseTo(0);
  });

  it('generateSquareWave should return a Float32Array of correct length with square wave data', () => {
    const amplitude = 0.8;
    const cycles = 1;
    const dutyCycle = 50;

    const result = generateSquareWave(amplitude, cycles, dutyCycle, WAVEFORM_POINTS);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(WAVEFORM_POINTS);

    // Check a few points
    expect(result[0]).toBeCloseTo(amplitude);
    expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(amplitude);
    expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(amplitude); // Just before the switch
    expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(-amplitude); // Just after the switch
  });

  it('generateSquareWave should throw RangeError for cycles <= 0', () => {
    expect(() => generateSquareWave(1, 0, 50, WAVEFORM_POINTS)).toThrow(RangeError);
    expect(() => generateSquareWave(1, -1, 50, WAVEFORM_POINTS)).toThrow(RangeError);
  });

  it('generateTriangleWave should return a Float32Array of correct length with triangle wave data', () => {
    const amplitude = 1.0;
    const cycles = 1;

    const result = generateTriangleWave(amplitude, cycles, WAVEFORM_POINTS);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(WAVEFORM_POINTS);

    // Check a few points
    expect(result[0]).toBeCloseTo(0);
    expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(amplitude);
    expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(0);
    expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(-amplitude);
  });

  it('generateTriangleWave should throw RangeError for cycles <= 0', () => {
    expect(() => generateTriangleWave(1, 0, WAVEFORM_POINTS)).toThrow(RangeError);
    expect(() => generateTriangleWave(1, -1, WAVEFORM_POINTS)).toThrow(RangeError);
  });
});
