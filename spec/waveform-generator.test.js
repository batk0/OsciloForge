import { describe, it, expect } from 'vitest';
import { generateSineWave, generateSquareWave, generateTriangleWave, generateRampWave, generateExponentialWave, generateNoise } from '../src/renderer/api/waveform-generator';
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

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateSineWave(-1, 1, 0, WAVEFORM_POINTS)).toThrow(RangeError);
      expect(() => generateSineWave(-1, 1, -1, WAVEFORM_POINTS)).toThrow(RangeError);
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

    it('should handle multiple cycles correctly', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;

      const result = generateTriangleWave(min, max, cycles, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // At start should be at min
      expect(result[0]).toBeCloseTo(min);
      // At 1/4 of first period should be at max
      expect(result[WAVEFORM_POINTS / (4 * cycles)]).toBeCloseTo(max);
      // At 1/2 of first period should be at min
      expect(result[WAVEFORM_POINTS / (2 * cycles)]).toBeCloseTo(min);
    });

    it('should handle very small min/max range', () => {
      const min = -0.001;
      const max = 0.001;
      const cycles = 1;

      const result = generateTriangleWave(min, max, cycles, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      // Peak should be at max
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Trough should be at min
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should handle extreme min/max values', () => {
      const min = -1.0;
      const max = 1.0;
      const cycles = 1;

      const result = generateTriangleWave(min, max, cycles, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      // Peak should be at max
      expect(result[WAVEFORM_POINTS / 4]).toBeCloseTo(max);
      // Trough should be at min
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });
  });

  describe('edge cases', () => {
    it('should handle sine wave with zero amplitude (min = max)', () => {
      const min = 0.5;
      const max = 0.5;
      const cycles = 1;

      const result = generateSineWave(min, max, cycles, WAVEFORM_POINTS);

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

      const result = generateSquareWave(min, max, cycles, dutyCycle, WAVEFORM_POINTS);

      // With 0% duty cycle, all values should be at min
      expect(result[0]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });

    it('should handle square wave with 100% duty cycle', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 1;
      const dutyCycle = 100;

      const result = generateSquareWave(min, max, cycles, dutyCycle, WAVEFORM_POINTS);

      // With 100% duty cycle, all values should be at max
      expect(result[0]).toBeCloseTo(max);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(max);
    });

    it('should handle multiple cycles for square wave', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const dutyCycle = 50;

      const result = generateSquareWave(min, max, cycles, dutyCycle, WAVEFORM_POINTS);

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

      const result = generateSineWave(min, max, cycles, WAVEFORM_POINTS);

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

      const result = generateRampWave(min, max, cycles, direction, WAVEFORM_POINTS);

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

      const result = generateRampWave(min, max, cycles, direction, WAVEFORM_POINTS);

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

      const result = generateRampWave(min, max, cycles, direction, WAVEFORM_POINTS);

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

      const result = generateRampWave(min, max, cycles, direction, WAVEFORM_POINTS);

      // Start should be at min
      expect(result[0]).toBeCloseTo(min);
      // End should be at max
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(max);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateRampWave(-1, 1, 0, 'up', WAVEFORM_POINTS)).toThrow(RangeError);
      expect(() => generateRampWave(-1, 1, -1, 'up', WAVEFORM_POINTS)).toThrow(RangeError);
    });

    it('should handle multiple cycles correctly', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const direction = 'up';

      const result = generateRampWave(min, max, cycles, direction, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);

      // Should have 4 complete ramps
      expect(result[0]).toBeCloseTo(min);
      expect(result[WAVEFORM_POINTS / 2]).toBeCloseTo(min);
    });
  });

  describe('generateExponentialWave', () => {
    it('should return a Float32Array of correct length with exponential wave data', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 2;
      const direction = 'up';

      const result = generateExponentialWave(min, max, cycles, direction, WAVEFORM_POINTS);

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

      const result = generateExponentialWave(min, max, cycles, direction, WAVEFORM_POINTS);

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

      const result = generateExponentialWave(min, max, cycles, direction, WAVEFORM_POINTS);

      // Start should be at max
      expect(result[0]).toBeCloseTo(max);
      // End should be at min
      expect(result[WAVEFORM_POINTS - 1]).toBeCloseTo(min);
    });

    it('should throw RangeError for cycles <= 0', () => {
      expect(() => generateExponentialWave(-1, 1, 0, 'up', WAVEFORM_POINTS)).toThrow(RangeError);
      expect(() => generateExponentialWave(-1, 1, -1, 'up', WAVEFORM_POINTS)).toThrow(RangeError);
    });

    it('should handle multiple cycles correctly', () => {
      const min = -0.5;
      const max = 0.5;
      const cycles = 4;
      const direction = 'up';

      const result = generateExponentialWave(min, max, cycles, direction, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);
    });
  });

  describe('generateNoise', () => {
    it('should return a Float32Array of correct length with noise data', () => {
      const amplitude = 0.5;

      const result = generateNoise(amplitude, WAVEFORM_POINTS);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(WAVEFORM_POINTS);
    });

    it('should generate values within amplitude range', () => {
      const amplitude = 0.5;
      const result = generateNoise(amplitude, WAVEFORM_POINTS);

      // All values should be between -amplitude and +amplitude
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(-amplitude);
        expect(result[i]).toBeLessThanOrEqual(amplitude);
      }
    });

    it('should generate different patterns on each call', () => {
      const amplitude = 0.5;
      const result1 = generateNoise(amplitude, WAVEFORM_POINTS);
      const result2 = generateNoise(amplitude, WAVEFORM_POINTS);

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

    it('should handle zero amplitude', () => {
      const amplitude = 0;
      const result = generateNoise(amplitude, WAVEFORM_POINTS);

      // All values should be 0 when amplitude is 0
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeCloseTo(0);
      }
    });

    it('should handle small amplitude', () => {
      const amplitude = 0.001;
      const result = generateNoise(amplitude, WAVEFORM_POINTS);

      // All values should be very small
      for (let i = 0; i < result.length; i++) {
        expect(Math.abs(result[i])).toBeLessThanOrEqual(amplitude);
      }
    });

    it('should handle maximum amplitude', () => {
      const amplitude = 1.0;
      const result = generateNoise(amplitude, WAVEFORM_POINTS);

      // All values should be between -1 and 1
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(-1);
        expect(result[i]).toBeLessThanOrEqual(1);
      }
    });
  });
});
