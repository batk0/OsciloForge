export function generateSineWave(min, max, cycles, points) {
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
