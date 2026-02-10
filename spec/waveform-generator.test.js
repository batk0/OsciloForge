import { describe, it, expect } from 'vitest';
import { generateSineWave, generateSquareWave, generateTriangleWave, generateRampWave, generateExponentialWave, generateNoise } from '../src/renderer/api/waveform-generator';
import { WAVEFORM_POINTS } from '../src/renderer/api/state.js';

describe('Waveform Generator', () => {
  describe('generateSineWave', () => {
    it('should return a Float32Array of correct length with sine wave data', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 2;

      const result = generateSineWave(min, max, cycles);

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

      const result = generateSineWave(min, max, cycles);

      // Peak should be at max
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Trough should be at min
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateSineWave(-1, 1, 0)).toThrow(RangeError);
      expect(() => generateSineWave(-1, 1, -1)).toThrow(RangeError);
    });
  });

  describe('generateSquareWave', () => {
    it('should return a Float32Array of correct length with square wave data', () => {
      const min = -0.8;
      const max = 0.8;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateSquareWave(min, max, cycles, dutyCycle);

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

      const result = generateSquareWave(min, max, cycles, dutyCycle);

      // High values should be at max
      expect(result[0]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Low values should be at min
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateSquareWave(-1, 1, 0, 50)).toThrow(RangeError);
      expect(() => generateSquareWave(-1, 1, -1, 50)).toThrow(RangeError);
    });
  });

  describe('generateTriangleWave', () => {
    it('should return a Float32Array of correct length with triangle wave data', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Check a few points
      expect(result[0]).toBeCloseTo(min);
      // With 50% duty cycle, should reach max at half period
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
      // Should be back at min at end of period
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(min);
    });

    it('should support asymmetric waveforms with different min and max', () => {
      const min = -0.2;
      const max = 0.8;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // With 50% duty cycle, should reach max at half period
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
      // Should be back at min at end of period
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateTriangleWave(-1, 1, 0, 50)).toThrow(RangeError);
      expect(() => generateTriangleWave(-1, 1, -1, 50)).toThrow(RangeError);
    });

    it('should throw RangeError for dutyCycle outside 0-100', () => {
      expect(() => generateTriangleWave(-1, 1, 1, -1)).toThrow(RangeError);
      expect(() => generateTriangleWave(-1, 1, 1, 101)).toThrow(RangeError);
    });

    it('should support 50% duty cycle (symmetric triangle)', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // With 50% duty cycle, should reach max at half period
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
      // Should return to min at end of period
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(min);
    });

    it('should support duty cycle < 50% (asymmetric with shorter rise)', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const dutyCycle = 25;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      // With 25% duty cycle, should reach max at 1/4 period
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Should start falling back down immediately after
      expect(result[WAVEFORM_POINTS / 4 + 1]).toBeLessThan(max);
    });

    it('should support duty cycle > 50% (asymmetric with longer rise)', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const dutyCycle = 75;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      // With 75% duty cycle, should still be rising at 3/4 period
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(max);
    });

    it('should handle multiple cycles correctly', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const dutyCycle = 50;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // At start should be at min
      expect(result[0]).toBeCloseTo(min);
      // At 1/2 of first period should be at max
      expect(result[WAVEFORM_POINTS / (2 * cycles)]).toBeCloseTo(max);
      // At end of first period should be at min
      expect(result[WAVEFORM_POINTS / cycles - 1]).toBeCloseTo(min);
    });

    it('should handle very small min/max range', () => {
      const min = -0.001;
      const max = 0.001;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // With 50% duty cycle, at half period should be at max
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
    });

    it('should handle extreme min/max values', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const dutyCycle = 50;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // With 50% duty cycle, at half period should be at max
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
    });

    it('should handle dutyCycle === 0 edge case', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const dutyCycle = 0;

      const result = generateTriangleWave(min, max, cycles, dutyCycle);

      // All values should be at min when dutyCycle is 0
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeCloseTo(min);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle sine wave with zero amplitude (min = max)', () => {
      const min = 0.5;
      const max = 0.5;
      const cycles = 1;

      const result = generateSineWave(min, max, cycles);

      // All values should be at the midpoint (which equals min and max)
      expect(result[0]).toBeCloseTo(0.5);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(0.5);
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(0.5);
    });

    it('should handle square wave with 0% duty cycle', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 1;
      const dutyCycle = 0;

      const result = generateSquareWave(min, max, cycles, dutyCycle);

      // With 0% duty cycle, all values should be at min
      expect(result[0]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should handle square wave with 100% duty cycle', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 1;
      const dutyCycle = 100;

      const result = generateSquareWave(min, max, cycles, dutyCycle);

      // With 100% duty cycle, all values should be at max
      expect(result[0]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
    });

    it('should handle multiple cycles for square wave', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const dutyCycle = 50;

      const result = generateSquareWave(min, max, cycles, dutyCycle);

      // Should have 4 complete cycles
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Start of each quarter should alternate between max and min
      expect(result[0]).toBeCloseTo(max);
    });

    it('should handle single cycle sine wave', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;

      const result = generateSineWave(min, max, cycles);

      // Start should be at midpoint (0)
      expect(result[0]).toBeCloseTo(0);
      // Quarter way should be at max
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Half way should be at midpoint (0)
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(0);
      // Three quarters should be at min
      expect(result[WAVEFORM_POINTS * 3 / 4]).toBeCloseTo(min);
    });
  });

  describe('generateRampWave', () => {
    it('should return a Float32Array of correct length with ramp wave data', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 2;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // End of first period should be at max
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(max);
      // Start of second period should be at min again
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should support ramp up direction', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // End should be at max
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(max);
    });

    it('should support ramp down direction', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'down';
      const dutyCycle = 100;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // Start should be at max
      expect(result[0]).toBeCloseTo(max);
      // End should be at min
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(min);
    });

    it('should support asymmetric waveforms with different min and max', () => {
      const min = -0.2;
      const max = 0.8;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // End should be at max
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(max);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateRampWave(-1, 1, 0, 'up', 50)).toThrow(RangeError);
      expect(() => generateRampWave(-1, 1, -1, 'up', 50)).toThrow(RangeError);
    });

    it('should throw RangeError for dutyCycle outside 0-100', () => {
      expect(() => generateRampWave(-1, 1, 1, 'up', -1)).toThrow(RangeError);
      expect(() => generateRampWave(-1, 1, 1, 'up', 101)).toThrow(RangeError);
    });

    it('should support 50% duty cycle for ramp up', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 50;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // With 50% duty cycle, should reach max at half period
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(max);
      // Should hold at max for second half
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(max);
    });

    it('should support 25% duty cycle for ramp up', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 25;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // With 25% duty cycle, should reach max at 1/4 period
      expect(result[WAVEFORM_POINTS / 4 - 1]).toBeCloseTo(max);
      // Should hold at max for remaining 75%
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
    });

    it('should support duty cycle for ramp down', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'down';
      const dutyCycle = 50;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // With 50% duty cycle, should reach min at half period
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(min);
      // Should hold at min for second half
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should handle multiple cycles correctly', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Should have 4 complete ramps
      expect(result[0]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should handle dutyCycle === 0 edge case', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 0;

      const result = generateRampWave(min, max, cycles, direction, dutyCycle);

      // All values should be at min when dutyCycle is 0
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeCloseTo(min);
      }
    });
  });

  describe('generateExponentialWave', () => {
    it('should return a Float32Array of correct length with exponential wave data', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 2;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // End of first period should be at max
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(max);
    });

    it('should support exponential up direction', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // End should be at max
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(max);
    });

    it('should support exponential down direction', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'down';
      const dutyCycle = 100;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // Start should be at max
      expect(result[0]).toBeCloseTo(max);
      // End should be at min
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateExponentialWave(-1, 1, 0, 'up', 50)).toThrow(RangeError);
      expect(() => generateExponentialWave(-1, 1, -1, 'up', 50)).toThrow(RangeError);
    });

    it('should throw RangeError for dutyCycle outside 0-100', () => {
      expect(() => generateExponentialWave(-1, 1, 1, 'up', -1)).toThrow(RangeError);
      expect(() => generateExponentialWave(-1, 1, 1, 'up', 101)).toThrow(RangeError);
    });

    it('should support 50% duty cycle for exponential up', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 50;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // With 50% duty cycle, should reach max at half period
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(max);
      // Should hold at max for second half
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(max);
    });

    it('should support 25% duty cycle for exponential up', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 25;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // With 25% duty cycle, should reach max at 1/4 period
      expect(result[WAVEFORM_POINTS / 4 - 1]).toBeCloseTo(max);
      // Should hold at max for remaining 75%
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
    });

    it('should support duty cycle for exponential down', () => {
      const min = 0.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'down';
      const dutyCycle = 50;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // With 50% duty cycle, should reach min at half period
      expect(result[WAVEFORM_POINTS / 2 - 1]).toBeCloseTo(min);
      // Should hold at min for second half
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should handle multiple cycles correctly', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);
    });

    it('should handle dutyCycle === 0 edge case', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 0;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // All values should be at min when dutyCycle is 0
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeCloseTo(min);
      }
    });

    it('should handle min === max (zero amplitude) edge case', () => {
      const min = 0.5;
      const max = 0.5;
      const cycles = 1;
      const direction = 'up';
      const dutyCycle = 100;

      const result = generateExponentialWave(min, max, cycles, direction, dutyCycle);

      // All values should be at min (which equals max) when amplitude is 0
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeCloseTo(0.5);
      }
    });
  });

  describe('generateNoise', () => {
    it('should return a Float32Array of correct length with noise data', () => {
      const min = -0.5;
      const max = 0.5;

      const result = generateNoise(min, max);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);
    });

    it('should generate values within min/max range', () => {
      const min = -0.5;
      const max = 0.5;
      const result = generateNoise(min, max);

      // All values should be between min and max
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(min);
        expect(result[i]).toBeLessThanOrEqual(max);
      }
    });

    it('should generate different patterns on each call', () => {
      const min = -0.5;
      const max = 0.5;
      const result1 = generateNoise(min, max);
      const result2 = generateNoise(min, max);

      // Arrays should be different (very high probability with random data)
      let different = false;
      for (let i = 0; i < result1.length; i++) {
        if (result1[i] !== result2[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });

    it('should handle zero range (min equals max)', () => {
      const min = 0.5;
      const max = 0.5;
      const result = generateNoise(min, max);

      // All values should be 0.5 when min equals max
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeCloseTo(0.5);
      }
    });

    it('should handle small range', () => {
      const min = -0.001;
      const max = 0.001;
      const result = generateNoise(min, max);

      // All values should be very small and within range
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(min);
        expect(result[i]).toBeLessThanOrEqual(max);
      }
    });

    it('should handle full range', () => {
      const min = -1.0;
      const max = 1.0;
      const result = generateNoise(min, max);

      // All values should be between -1 and 1
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(-1);
        expect(result[i]).toBeLessThanOrEqual(1);
      }
    });

    it('should handle inverted range (min > max)', () => {
      const min = 1.0;
      const max = -1.0;
      const result = generateNoise(min, max);

      // All values should be between max and min (inverted range)
      // When min > max, the formula becomes: max + Math.random() * (min - max)
      // This should still generate valid values in the [max, min] range
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(max);
        expect(result[i]).toBeLessThanOrEqual(min);
      }
    });
  });
});
