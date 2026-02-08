import { describe, it, expect } from 'vitest';
import { generateSineWave, generateSquareWave, generateTriangleWave } from '../src/renderer/api/waveform-generator';
import { WAVEFORM_POINTS } from '../src/renderer/api/state.js';

describe('Waveform Generator', () => {
  describe('generateSineWave', () => {
    it('should return a Float32Array of correct length with sine wave data', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 2;

      const result = generateSineWave(min, max, cycles, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Check a few points
      // At 0, sine wave should be at midpoint
      const midpoint = (max + min) / 2;
      expect(result[0]).toBeCloseTo(midpoint);
      // At WAVEFORM_POINTS / 4 for 2 cycles, it will be at max
      expect(result[WAVEFORM_POINTS / (4 * cycles)]).toBeCloseTo(max);
      // At WAVEFORM_POINTS / 2 for 2 cycles, it will be at midpoint
      expect(result[WAVEFORM_POINTS / (2 * cycles)]).toBeCloseTo(midpoint);
    });

    it('should support asymmetric waveforms with different min and max', () => {
      const min = -0.8;
      const max = 0.2;
      const cycles = 1;

      const result = generateSineWave(min, max, cycles, WAVEFORM_POINTS);

      // Peak should be at max
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Trough should be at min
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(min);
    });
  });

  describe('generateSquareWave', () => {
    it('should return a Float32Array of correct length with square wave data', () => {
      const min = -0.8;
      const max = 0.8;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateSquareWave(min, max, cycles, dutyCycle, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Check a few points
      expect(result[0]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(max); // Just before the switch
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min); // Just after the switch
    });

    it('should support asymmetric waveforms with different min and max', () => {
      const min = -0.3;
      const max = 0.7;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateSquareWave(min, max, cycles, dutyCycle, WAVEFORM_POINTS);

      // High values should be at max
      expect(result[0]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Low values should be at min
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateSquareWave(-1, 1, 0, 50, WAVEFORM_POINTS)).toThrow(RangeError);
      expect(() => generateSquareWave(-1, 1, -1, 50, WAVEFORM_POINTS)).toThrow(RangeError);
    });
  });

  describe('generateTriangleWave', () => {
    it('should return a Float32Array of correct length with triangle wave data', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;

      const result = generateTriangleWave(min, max, cycles, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Check a few points
      expect(result[0]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(max);
    });

    it('should support asymmetric waveforms with different min and max', () => {
      const min = -0.2;
      const max = 0.8;
      const cycles = 1;

      const result = generateTriangleWave(min, max, cycles, WAVEFORM_POINTS);

      // Peak should be at max
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Trough should be at min
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
      expect(result[0]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateTriangleWave(-1, 1, 0, WAVEFORM_POINTS)).toThrow(RangeError);
      expect(() => generateTriangleWave(-1, 1, -1, WAVEFORM_POINTS)).toThrow(RangeError);
    });
  });
});
