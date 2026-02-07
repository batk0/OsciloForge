export function generateSineWave(amplitude, cycles, points) {
  const data = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    data[i] = amplitude * Math.sin(2 * Math.PI * cycles * (i / points));
  }
  return data;
}

export function generateSquareWave(amplitude, cycles, dutyCycle, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const periodPoints = points / cycles;
  const dutyPoints = periodPoints * (dutyCycle / 100);
  for (let i = 0; i < points; i++) {
    const phaseInPeriod = i % periodPoints;
    data[i] = phaseInPeriod < dutyPoints ? amplitude : -amplitude;
  }
  return data;
}

export function generateTriangleWave(amplitude, cycles, points) {
  if (cycles <= 0) {
    throw new RangeError('cycles must be > 0');
  }
  const data = new Float32Array(points);
  const periodPoints = points / cycles;
  const quarterPeriod = periodPoints / 4;
  for (let i = 0; i < points; i++) {
    const phaseInPeriod = i % periodPoints;
    if (phaseInPeriod < quarterPeriod) {
      // First quarter: 0 to amplitude
      data[i] = amplitude * (phaseInPeriod / quarterPeriod);
    } else if (phaseInPeriod < 2 * quarterPeriod) {
      // Second quarter: amplitude to 0
      data[i] =
        amplitude * (1 - (phaseInPeriod - quarterPeriod) / quarterPeriod);
    } else if (phaseInPeriod < 3 * quarterPeriod) {
      // Third quarter: 0 to -amplitude
      data[i] =
        -amplitude * ((phaseInPeriod - 2 * quarterPeriod) / quarterPeriod);
    } else {
      // Fourth quarter: -amplitude to 0
      data[i] =
        -amplitude * (1 - (phaseInPeriod - 3 * quarterPeriod) / quarterPeriod);
    }
  }
  return data;
}
