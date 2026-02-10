import { WAVEFORM_POINTS } from './state.js';

export function generateSineWave(min, max, cycles) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(WAVEFORM_POINTS);
  const midpoint = (max + min) / 2;
  const amplitude = (max - min) / 2;
  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    data[i] = midpoint + amplitude * Math.sin(2 * Math.PI * cycles * (i / WAVEFORM_POINTS));
  }
  return data;
}

export function generateSquareWave(min, max, cycles, dutyCycle) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(WAVEFORM_POINTS);
  const periodPoints = WAVEFORM_POINTS / cycles;
  const dutyPoints = periodPoints * (dutyCycle / 100);
  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    const phaseInPeriod = i % periodPoints;
    data[i] = phaseInPeriod < dutyPoints ? max : min;
  }
  return data;
}

export function generateTriangleWave(min, max, cycles, dutyCycle) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  if (dutyCycle < 0 || dutyCycle > 100) {
    throw new RangeError('dutyCycle must be between 0 and 100');
  }
  const data = new Float32Array(WAVEFORM_POINTS);

  // Handle dutyCycle edge cases
  if (dutyCycle === 0) {
    data.fill(min);
    return data;
  }
  if (dutyCycle === 100) {
    data.fill(max);
    return data;
  }
  const periodPoints = WAVEFORM_POINTS / cycles;
  const dutyPoints = periodPoints * (dutyCycle / 100);

  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    const phaseInPeriod = i % periodPoints;

    if (dutyCycle <= 50) {
      // Duty cycle <= 50%: Rise from min to max over dutyPoints, then fall
      if (phaseInPeriod < dutyPoints) {
        // Rising phase: min to max over dutyPoints
        data[i] = min + (max - min) * (phaseInPeriod / dutyPoints);
      } else {
        // Falling phase: max to min over remaining period
        const fallPhase = phaseInPeriod - dutyPoints;
        const fallDuration = periodPoints - dutyPoints;
        data[i] = max - (max - min) * (fallPhase / fallDuration);
      }
    } else {
      // Duty cycle > 50%: Fall phase is proportionally shorter
      const fallPoints = periodPoints * ((100 - dutyCycle) / 100);

      if (phaseInPeriod < (periodPoints - fallPoints)) {
        // Rising phase: min to max over most of period
        const risePhase = phaseInPeriod;
        const riseDuration = periodPoints - fallPoints;
        data[i] = min + (max - min) * (risePhase / riseDuration);
      } else {
        // Falling phase: max to min over fallPoints
        const fallPhase = phaseInPeriod - (periodPoints - fallPoints);
        data[i] = max - (max - min) * (fallPhase / fallPoints);
      }
    }
  }
  return data;
}

export function generateRampWave(min, max, cycles, direction, dutyCycle) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  if (dutyCycle < 0 || dutyCycle > 100) {
    throw new RangeError('dutyCycle must be between 0 and 100');
  }
  const data = new Float32Array(WAVEFORM_POINTS);

  // Handle dutyCycle === 0 edge case
  if (dutyCycle === 0) {
    data.fill(min);
    return data;
  }
  const periodPoints = WAVEFORM_POINTS / cycles;
  const dutyPoints = periodPoints * (dutyCycle / 100);

  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    const phaseInPeriod = i % periodPoints;

    if (direction === 'up') {
      // Ramp up: linear from min to max over dutyPoints, then hold at max
      if (phaseInPeriod < dutyPoints) {
        data[i] = min + (max - min) * (phaseInPeriod / dutyPoints);
      } else {
        data[i] = max;
      }
    } else {
      // Ramp down: linear from max to min over dutyPoints, then hold at min
      if (phaseInPeriod < dutyPoints) {
        data[i] = max - (max - min) * (phaseInPeriod / dutyPoints);
      } else {
        data[i] = min;
      }
    }
  }
  return data;
}

export function generateExponentialWave(min, max, cycles, direction, dutyCycle) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  if (dutyCycle < 0 || dutyCycle > 100) {
    throw new RangeError('dutyCycle must be between 0 and 100');
  }
  const data = new Float32Array(WAVEFORM_POINTS);

  // Handle dutyCycle === 0 edge case
  if (dutyCycle === 0) {
    data.fill(min);
    return data;
  }
  const periodPoints = WAVEFORM_POINTS / cycles;
  const dutyPoints = periodPoints * (dutyCycle / 100);
  const amplitude = max - min;

  // Handle amplitude === 0 (constant value) or division by zero edge case
  if (Math.abs(amplitude) < Number.EPSILON) {
    // When amplitude is 0, all values should be at min (which equals max)
    data.fill(min);
    return data;
  }

  // Pre-calculate the exponential scaling factor
  // We want exp(k * 1) = amplitude, so k = ln(amplitude + 1)
  const expScale = Math.log(amplitude + 1);

  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    const phaseInPeriod = i % periodPoints;

    if (direction === 'up') {
      // Exponential curve from min to max over dutyPoints, then hold at max
      if (phaseInPeriod < dutyPoints) {
        const normalizedPhase = phaseInPeriod / dutyPoints;
        data[i] = min + amplitude * (Math.exp(normalizedPhase * expScale) - 1) / (Math.exp(expScale) - 1);
      } else {
        data[i] = max;
      }
    } else {
      // Exponential curve from max to min over dutyPoints, then hold at min
      if (phaseInPeriod < dutyPoints) {
        const normalizedPhase = phaseInPeriod / dutyPoints;
        data[i] = max - amplitude * (Math.exp(normalizedPhase * expScale) - 1) / (Math.exp(expScale) - 1);
      } else {
        data[i] = min;
      }
    }
  }
  return data;
}

export function generateNoise(min, max) {
  // Handle edge case: min > max - swap values to ensure valid range
  if (min > max) {
    const temp = min;
    min = max;
    max = temp;
  }

  const data = new Float32Array(WAVEFORM_POINTS);

  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    // Generate random values between min and max
    data[i] = min + Math.random() * (max - min);
  }
  return data;
}
