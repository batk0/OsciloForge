export function generateSineWave(min, max, cycles, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const midpoint = (max + min) / 2;
  const amplitude = (max - min) / 2;
  for (let i = 0; i < points; i++) {
    data[i] = midpoint + amplitude * Math.sin(2 * Math.PI * cycles * (i / points));
  }
  return data;
}

export function generateSquareWave(min, max, cycles, dutyCycle, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const periodPoints = points / cycles;
  const dutyPoints = periodPoints * (dutyCycle / 100);
  for (let i = 0; i < points; i++) {
    const phaseInPeriod = i % periodPoints;
    data[i] = phaseInPeriod < dutyPoints ? max : min;
  }
  return data;
}

export function generateTriangleWave(min, max, cycles, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const periodPoints = points / cycles;
  const quarterPeriod = periodPoints / 4;
  for (let i = 0; i < points; i++) {
    const phaseInPeriod = i % periodPoints;
    if (phaseInPeriod < quarterPeriod) {
      // First quarter: min to max
      data[i] = min + (max - min) * (phaseInPeriod / quarterPeriod);
    } else if (phaseInPeriod < 2 * quarterPeriod) {
      // Second quarter: max to min
      data[i] = max - (max - min) * ((phaseInPeriod - quarterPeriod) / quarterPeriod);
    } else if (phaseInPeriod < 3 * quarterPeriod) {
      // Third quarter: min to max
      data[i] = min + (max - min) * ((phaseInPeriod - 2 * quarterPeriod) / quarterPeriod);
    } else {
      // Fourth quarter: max to min
      data[i] = max - (max - min) * ((phaseInPeriod - 3 * quarterPeriod) / quarterPeriod);
    }
  }
  return data;
}

export function generateRampWave(min, max, cycles, direction, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const periodPoints = points / cycles;

  for (let i = 0; i < points; i++) {
    const phaseInPeriod = i % periodPoints;
    const phase = phaseInPeriod / periodPoints; // Normalized phase 0-1

    if (direction === 'up') {
      // Linear ramp from min to max
      data[i] = min + (max - min) * phase;
    } else {
      // Linear ramp from max to min
      data[i] = max - (max - min) * phase;
    }
  }
  return data;
}

export function generateExponentialWave(min, max, cycles, direction, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const periodPoints = points / cycles;
  const amplitude = max - min;

  for (let i = 0; i < points; i++) {
    const phaseInPeriod = i % periodPoints;
    const phase = phaseInPeriod / periodPoints; // Normalized phase 0-1

    if (direction === 'up') {
      // Exponential curve from min to max using exp
      // Use exp(phase * ln(2)) - this gives a nice exponential curve
      // that goes from min to max over the phase
      data[i] = min + amplitude * (Math.exp(phase * Math.log(amplitude + 1)) - 1) / (Math.exp(Math.log(amplitude + 1)) - 1);
    } else {
      // Exponential curve from max to min
      data[i] = max - amplitude * (Math.exp(phase * Math.log(amplitude + 1)) - 1) / (Math.exp(Math.log(amplitude + 1)) - 1);
    }
  }
  return data;
}

export function generateNoise(amplitude, points) {
  const data = new Float32Array(points);
  // Amplitude represents the range from -amplitude to +amplitude
  const min = -amplitude;
  const max = amplitude;

  for (let i = 0; i < points; i++) {
    // Generate random values between min and max
    data[i] = min + Math.random() * (max - min);
  }
  return data;
}
