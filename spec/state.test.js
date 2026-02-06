import { describe, it, expect, beforeEach } from 'vitest';
import {
  WAVEFORM_POINTS,
  TOP_PADDING,
  RIGHT_PADDING,
  BOTTOM_PADDING,
  LEFT_PADDING,
  state,
  updateState
} from '../src/renderer/api/state.js';

describe('State Constants', () => {
  it('should have correct WAVEFORM_POINTS value', () => {
    expect(WAVEFORM_POINTS).toBe(4096);
  });

  it('should have correct padding constants', () => {
    expect(TOP_PADDING).toBe(20);
    expect(RIGHT_PADDING).toBe(20);
    expect(BOTTOM_PADDING).toBe(30);
    expect(LEFT_PADDING).toBe(50);
  });

  it('should have constants that are immutable', () => {
    expect(() => {
      // eslint-disable-next-line no-import-assign
      WAVEFORM_POINTS = 5000;
    }).toThrow();

    expect(() => {
      // eslint-disable-next-line no-import-assign
      TOP_PADDING = 25;
    }).toThrow();

    expect(() => {
      // eslint-disable-next-line no-import-assign
      RIGHT_PADDING = 25;
    }).toThrow();

    expect(() => {
      // eslint-disable-next-line no-import-assign
      BOTTOM_PADDING = 35;
    }).toThrow();

    expect(() => {
      // eslint-disable-next-line no-import-assign
      LEFT_PADDING = 55;
    }).toThrow();
  });
});

describe('State Object Initial Values', () => {
  it('should have correct initial state structure', () => {
    expect(state).toHaveProperty('waveformData');
    expect(state).toHaveProperty('lastLoadedWaveformData');
    expect(state).toHaveProperty('hZoom');
    expect(state).toHaveProperty('vZoom');
    expect(state).toHaveProperty('viewOffset');
    expect(state).toHaveProperty('vShift');
    expect(state).toHaveProperty('drawStyle');
    expect(state).toHaveProperty('editMode');
  });

  it('should have Float32Array waveformData with correct size and default values', () => {
    expect(state.waveformData).toBeInstanceOf(Float32Array);
    expect(state.waveformData.length).toBe(WAVEFORM_POINTS);
    expect(Array.from(state.waveformData)).toEqual(new Array(WAVEFORM_POINTS).fill(0.0));
  });

  it('should have Float32Array lastLoadedWaveformData with correct size and default values', () => {
    expect(state.lastLoadedWaveformData).toBeInstanceOf(Float32Array);
    expect(state.lastLoadedWaveformData.length).toBe(WAVEFORM_POINTS);
    expect(Array.from(state.lastLoadedWaveformData)).toEqual(new Array(WAVEFORM_POINTS).fill(0.0));
  });

  it('should have correct numeric default values', () => {
    expect(state.hZoom).toBe(1);
    expect(state.vZoom).toBe(1);
    expect(state.viewOffset).toBe(0);
    expect(state.vShift).toBe(0);
    expect(typeof state.hZoom).toBe('number');
    expect(typeof state.vZoom).toBe('number');
    expect(typeof state.viewOffset).toBe('number');
    expect(typeof state.vShift).toBe('number');
  });

  it('should have correct string default values', () => {
    expect(state.drawStyle).toBe('line');
    expect(state.editMode).toBe('freehand');
    expect(typeof state.drawStyle).toBe('string');
    expect(typeof state.editMode).toBe('string');
  });

  it('should have separate waveformData and lastLoadedWaveformData instances', () => {
    expect(state.waveformData).not.toBe(state.lastLoadedWaveformData);
  });
});

describe('updateState Function', () => {
  let originalState;

  beforeEach(() => {
    // Reset state to initial values before each test
    originalState = {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
      lastLoadedWaveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'line',
      editMode: 'freehand'
    };

    // Reset the actual state
    Object.assign(state, originalState);
  });

  it('should update a single property', () => {
    const result = updateState({ hZoom: 2 });

    expect(result).toBeUndefined();
    expect(state.hZoom).toBe(2);
    expect(state.vZoom).toBe(1); // Other properties unchanged
    expect(state.viewOffset).toBe(0);
    expect(state.drawStyle).toBe('line');
  });

  it('should update multiple properties at once', () => {
    const updates = {
      hZoom: 3,
      vZoom: 2.5,
      drawStyle: 'points',
      editMode: 'erase'
    };

    const result = updateState(updates);

    expect(result).toBeUndefined();
    expect(state.hZoom).toBe(3);
    expect(state.vZoom).toBe(2.5);
    expect(state.drawStyle).toBe('points');
    expect(state.editMode).toBe('erase');
    expect(state.viewOffset).toBe(0); // Unchanged property
  });

  it('should update waveformData with new Float32Array', () => {
    const newData = new Float32Array(WAVEFORM_POINTS);
    for (let i = 0; i < WAVEFORM_POINTS; i++) {
      newData[i] = Math.sin(i * 0.01) * 0.5;
    }

    updateState({ waveformData: newData });

    expect(state.waveformData).toBe(newData);
    expect(state.waveformData).not.toBe(originalState.waveformData);
    expect(state.lastLoadedWaveformData).toBe(originalState.lastLoadedWaveformData); // Unchanged
  });

  it('should update numeric properties with various valid values', () => {
    updateState({ hZoom: 0.5 });
    expect(state.hZoom).toBe(0.5);

    updateState({ vZoom: 10 });
    expect(state.vZoom).toBe(10);

    updateState({ viewOffset: -100 });
    expect(state.viewOffset).toBe(-100);

    updateState({ vShift: 0.75 });
    expect(state.vShift).toBe(0.75);
  });

  it('should update string properties with various valid values', () => {
    updateState({ drawStyle: 'points' });
    expect(state.drawStyle).toBe('points');

    updateState({ editMode: 'line' });
    expect(state.editMode).toBe('line');

    updateState({ drawStyle: 'filled' });
    expect(state.drawStyle).toBe('filled');
  });

  it('should handle empty object update', () => {
    const beforeState = { ...state };
    const result = updateState({});

    expect(result).toBeUndefined();
    expect(state).toEqual(beforeState);
  });

  it('should handle null and undefined updates gracefully', () => {
    const beforeState = { ...state };

    expect(() => updateState(null)).not.toThrow();
    expect(state).toEqual(beforeState);

    expect(() => updateState(undefined)).not.toThrow();
    expect(state).toEqual(beforeState);
  });

  it('should modify the original state object (not replace it)', () => {
    const originalStateRef = state;

    updateState({ hZoom: 5 });

    expect(state).toBe(originalStateRef); // Same reference
    expect(state.hZoom).toBe(5);
  });

  it('should assign undefined properties (Object.assign behavior)', () => {
    updateState({
      hZoom: 2,
      vZoom: undefined,
      drawStyle: 'points',
      editMode: undefined
    });

    expect(state.hZoom).toBe(2);
    expect(state.vZoom).toBeUndefined(); // Object.assign assigns undefined
    expect(state.drawStyle).toBe('points');
    expect(state.editMode).toBeUndefined(); // Object.assign assigns undefined
  });
});

describe('State Immutability', () => {
  it('should allow state object modification by design', () => {
    const originalHZoom = state.hZoom;

    state.hZoom = 3;

    expect(state.hZoom).toBe(3);
    expect(state.hZoom).not.toBe(originalHZoom);

    // Reset for other tests
    state.hZoom = originalHZoom;
  });

  it('should allow Float32Array data modification', () => {
    const originalFirstValue = state.waveformData[0];

    state.waveformData[0] = 0.5;
    state.waveformData[1] = -0.25;

    expect(state.waveformData[0]).toBe(0.5);
    expect(state.waveformData[1]).toBe(-0.25);
    expect(state.waveformData[0]).not.toBe(originalFirstValue);

    // Reset for other tests
    state.waveformData[0] = originalFirstValue;
    state.waveformData[1] = 0;
  });

  it('should maintain separate instances when waveformData is replaced', () => {
    const originalWaveform = state.waveformData;
    const newWaveform = new Float32Array(WAVEFORM_POINTS).fill(0.25);

    updateState({ waveformData: newWaveform });

    expect(state.waveformData).toBe(newWaveform);
    expect(state.waveformData).not.toBe(originalWaveform);
    expect(originalWaveform).not.toEqual(newWaveform);
  });
});

describe('Integration Testing - Realistic Scenarios', () => {
  beforeEach(() => {
    // Reset state to initial values
    Object.assign(state, {
      waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
      lastLoadedWaveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'line',
      editMode: 'freehand'
    });
  });

  it('should handle waveform loading scenario', () => {
    // Simulate loading a new waveform
    const newWaveformData = new Float32Array(WAVEFORM_POINTS);
    for (let i = 0; i < WAVEFORM_POINTS; i++) {
      newWaveformData[i] = Math.sin(i * 0.02) * 0.8;
    }

    updateState({
      waveformData: newWaveformData,
      lastLoadedWaveformData: new Float32Array(newWaveformData), // Copy
      hZoom: 1,
      viewOffset: 0
    });

    expect(state.waveformData).toEqual(newWaveformData);
    expect(state.lastLoadedWaveformData).toEqual(newWaveformData);
    expect(state.waveformData).not.toBe(state.lastLoadedWaveformData); // Different instances
    expect(state.hZoom).toBe(1);
    expect(state.viewOffset).toBe(0);
  });

  it('should handle zoom and pan scenario', () => {
    // Simulate user zooming in and panning
    updateState({ hZoom: 2.5 });
    expect(state.hZoom).toBe(2.5);

    updateState({ vZoom: 1.5 });
    expect(state.vZoom).toBe(1.5);

    updateState({ viewOffset: 100 });
    expect(state.viewOffset).toBe(100);

    updateState({ vShift: -0.2 });
    expect(state.vShift).toBe(-0.2);

    // Other properties should remain unchanged
    expect(state.drawStyle).toBe('line');
    expect(state.editMode).toBe('freehand');
    expect(state.waveformData.length).toBe(WAVEFORM_POINTS);
  });

  it('should handle editing mode changes', () => {
    // Simulate switching between different editing modes
    const modes = ['freehand', 'line', 'erase'];
    const styles = ['line', 'points', 'filled'];

    modes.forEach(mode => {
      updateState({ editMode: mode });
      expect(state.editMode).toBe(mode);
    });

    styles.forEach(style => {
      updateState({ drawStyle: style });
      expect(state.drawStyle).toBe(style);
    });

    // Final state should reflect last changes
    expect(state.editMode).toBe('erase');
    expect(state.drawStyle).toBe('filled');
  });

  it('should handle complex state updates in sequence', () => {
    // Simulate a complex user interaction sequence

    // 1. Load waveform
    const testData = new Float32Array(WAVEFORM_POINTS).fill(0.3);
    updateState({
      waveformData: testData,
      lastLoadedWaveformData: new Float32Array(testData)
    });

    // 2. Zoom in
    updateState({ hZoom: 3, vZoom: 2 });

    // 3. Pan to center
    updateState({ viewOffset: WAVEFORM_POINTS / 2 });

    // 4. Switch to edit mode
    updateState({ editMode: 'line', drawStyle: 'points' });

    // 5. Make some edits
    state.waveformData[100] = 1.0;
    state.waveformData[200] = -1.0;

    // Verify final state
    expect(state.hZoom).toBe(3);
    expect(state.vZoom).toBe(2);
    expect(state.viewOffset).toBe(WAVEFORM_POINTS / 2);
    expect(state.editMode).toBe('line');
    expect(state.drawStyle).toBe('points');
    expect(state.waveformData[100]).toBe(1.0);
    expect(state.waveformData[200]).toBe(-1.0);
    expect(state.waveformData[0]).toBeCloseTo(0.3, 5); // Float32Array precision
    expect(state.lastLoadedWaveformData[100]).toBeCloseTo(0.3, 5); // Original data unchanged
  });

  it('should handle reset to defaults scenario', () => {
    // Modify state
    updateState({
      hZoom: 5,
      vZoom: 3,
      viewOffset: 200,
      vShift: 0.5,
      drawStyle: 'points',
      editMode: 'erase'
    });

    // Modify waveform data
    state.waveformData[0] = 1.0;

    // Reset to defaults (except waveform data)
    updateState({
      hZoom: 1,
      vZoom: 1,
      viewOffset: 0,
      vShift: 0,
      drawStyle: 'line',
      editMode: 'freehand'
    });

    // Verify reset
    expect(state.hZoom).toBe(1);
    expect(state.vZoom).toBe(1);
    expect(state.viewOffset).toBe(0);
    expect(state.vShift).toBe(0);
    expect(state.drawStyle).toBe('line');
    expect(state.editMode).toBe('freehand');
    expect(state.waveformData[0]).toBe(1.0); // Waveform data preserved
  });
});
