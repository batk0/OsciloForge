export const WAVEFORM_POINTS = 4096;
export const TOP_PADDING = 20;
export const RIGHT_PADDING = 20;
export const BOTTOM_PADDING = 30;
export const LEFT_PADDING = 50;

export const state = {
  waveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
  lastLoadedWaveformData: new Float32Array(WAVEFORM_POINTS).fill(0.0),
  hZoom: 1,
  vZoom: 1,
  viewOffset: 0,
  vShift: 0,
  drawStyle: 'line',
  editMode: 'freehand',
  lineStartPoint: null
};

export function updateState(updates) {
  Object.assign(state, updates);
}
