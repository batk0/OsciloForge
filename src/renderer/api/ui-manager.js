import { generateSineWave, generateSquareWave, generateTriangleWave } from './waveform-generator.js';
import { WAVEFORM_POINTS, TOP_PADDING, BOTTOM_PADDING } from './state.js';

export class UIManager {
  constructor(state, updateState, canvasDrawer, mouseHandler, drawFunction) {
    this.state = state;
    this.updateState = updateState;
    this.canvasDrawer = canvasDrawer;
    this.mouseHandler = mouseHandler;
    this.draw = drawFunction;

    // DOM Elements
    this.canvas = null;
    this.openBtn = null;
    this.saveBtn = null;
    this.resetBtn = null;
    this.hZoomSlider = null;
    this.vZoomSlider = null;
    this.shiftLeftBtn = null;
    this.shiftRightBtn = null;
    this.shiftUpBtn = null;
    this.shiftDownBtn = null;
    this.drawStyleLine = null;
    this.drawStyleDots = null;
    this.waveformTypeSelect = null;
    this.amplitudeInput = null;
    this.cyclesInput = null;
    this.dutyCycleInput = null;
    this.generateWaveformBtn = null;
    this.downloadDeviceBtn = null;
  }

  initializeElements() {
    this.canvas = document.getElementById('waveform-canvas');
    this.openBtn = document.getElementById('open-btn');
    this.saveBtn = document.getElementById('save-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.hZoomSlider = document.getElementById('h-zoom');
    this.vZoomSlider = document.getElementById('v-zoom');
    this.shiftLeftBtn = document.getElementById('shift-left-btn');
    this.shiftRightBtn = document.getElementById('shift-right-btn');
    this.shiftUpBtn = document.getElementById('shift-up-btn');
    this.shiftDownBtn = document.getElementById('shift-down-btn');
    this.drawStyleLine = document.getElementById('draw-style-line');
    this.drawStyleDots = document.getElementById('draw-style-dots');
    this.waveformTypeSelect = document.getElementById('waveform-type');
    this.amplitudeInput = document.getElementById('amplitude');
    this.cyclesInput = document.getElementById('cycles');
    this.dutyCycleInput = document.getElementById('duty-cycle');
    this.generateWaveformBtn = document.getElementById('generate-waveform-btn');
    this.downloadDeviceBtn = document.getElementById('download-device-btn');
  }

  setupEventListeners() {
    this.setupShiftListeners();
    this.setupZoomListeners();
    this.setupDrawStyleListeners();
    this.setupEditModeListeners();
    this.setupFileOperationListeners();
    this.setupWaveformGenerationListeners();
    this.setupDeviceDownloadListener();
  }

  setupShiftListeners() {
    if (!this.shiftLeftBtn || !this.shiftRightBtn || !this.shiftUpBtn || !this.shiftDownBtn) {
      return;
    }

    this.shiftLeftBtn.addEventListener('click', () => {
      const visiblePoints = WAVEFORM_POINTS / this.state.hZoom;
      const shiftAmount = Math.max(1, Math.floor(visiblePoints / 10));
      this.updateState({ viewOffset: Math.max(0, this.state.viewOffset - shiftAmount) });
      this.draw();
    });

    this.shiftRightBtn.addEventListener('click', () => {
      const visiblePoints = WAVEFORM_POINTS / this.state.hZoom;
      const shiftAmount = Math.max(1, Math.floor(visiblePoints / 10));
      const maxOffset = Math.max(0, WAVEFORM_POINTS - visiblePoints);
      const newOffset = this.state.viewOffset + shiftAmount;
      this.updateState({ viewOffset: Math.min(maxOffset, newOffset) });
      this.draw();
    });

    this.shiftUpBtn.addEventListener('click', () => {
      if (!this.canvas) {
        return;
      }
      const chartHeight = this.canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
      const shiftAmount = Math.max(1, Math.floor(chartHeight / 38));
      const maxPixelShift = (chartHeight / 2) * (this.state.vZoom - 1);
      this.updateState({ vShift: Math.max(-maxPixelShift, this.state.vShift - shiftAmount) });
      this.draw();
    });

    this.shiftDownBtn.addEventListener('click', () => {
      if (!this.canvas) {
        return;
      }
      const chartHeight = this.canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
      const shiftAmount = Math.max(1, Math.floor(chartHeight / 38));
      const maxPixelShift = (chartHeight / 2) * (this.state.vZoom - 1);
      this.updateState({ vShift: Math.min(maxPixelShift, this.state.vShift + shiftAmount) });
      this.draw();
    });
  }

  setupZoomListeners() {
    if (!this.hZoomSlider || !this.vZoomSlider) {
      return;
    }

    this.hZoomSlider.addEventListener('input', (e) => {
      const oldHZoom = this.state.hZoom;
      const newHZoom = parseFloat(e.target.value);

      const visiblePointsOld = WAVEFORM_POINTS / oldHZoom;
      const visiblePointsNew = WAVEFORM_POINTS / newHZoom;

      const centerPoint = this.state.viewOffset + visiblePointsOld / 2;

      let newViewOffset = centerPoint - visiblePointsNew / 2;

      const maxOffset = Math.max(0, WAVEFORM_POINTS - visiblePointsNew);
      newViewOffset = Math.max(0, Math.min(maxOffset, newViewOffset));

      this.updateState({ hZoom: newHZoom, viewOffset: newViewOffset });
      this.draw();
    });

    this.vZoomSlider.addEventListener('input', (e) => {
      if (!this.canvas) {
        return;
      }
      const newVZoom = parseFloat(e.target.value);
      const chartHeight = this.canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
      const maxPixelShift = (chartHeight / 2) * (newVZoom - 1);
      this.updateState({
        vZoom: newVZoom,
        vShift: Math.max(-maxPixelShift, Math.min(maxPixelShift, this.state.vShift))
      });
      this.draw();
    });
  }

  setupDrawStyleListeners() {
    if (!this.drawStyleLine || !this.drawStyleDots) {
      return;
    }

    this.drawStyleLine.addEventListener('change', () => {
      this.updateState({ drawStyle: 'line' });
      this.draw();
    });

    this.drawStyleDots.addEventListener('change', () => {
      this.updateState({ drawStyle: 'dots' });
      this.draw();
    });
  }

  setupEditModeListeners() {
    const editModeRadios = document.querySelectorAll('input[name="edit-mode"]');
    if (editModeRadios.length === 0) {
      return;
    }

    editModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateState({ editMode: e.target.value });
        this.mouseHandler.setEditMode(this.state.editMode);
      });
    });
  }

  setupFileOperationListeners() {
    if (!this.openBtn || !this.saveBtn || !this.resetBtn) {
      return;
    }

    this.openBtn.addEventListener('click', async () => {
      const fileContent = await window.electronAPI.openFile();
      if (fileContent !== undefined && fileContent !== null) {
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          const numericData = lines.map(line => parseFloat(line.trim()));

          if (numericData.some(isNaN)) {
            alert('Error: File contains non-numeric values.');
            return;
          }

          const finalData = new Float32Array(WAVEFORM_POINTS);

          const clampedData = numericData.slice(0, WAVEFORM_POINTS).map(val => Math.max(-1.0, Math.min(1.0, val)));
          finalData.set(clampedData);

          // Reset zoom and pan on new file
          this.hZoomSlider.value = 1;
          this.vZoomSlider.value = 1;
          this.updateState({
            waveformData: finalData,
            lastLoadedWaveformData: new Float32Array(finalData),
            hZoom: 1,
            vZoom: 1,
            viewOffset: 0
          });

          this.draw();
        }
      }
    });

    this.saveBtn.addEventListener('click', async () => {
      const dataString = Array.from(this.state.waveformData).join('\n');
      await window.electronAPI.saveFile(dataString);
    });

    this.resetBtn.addEventListener('click', () => {
      this.hZoomSlider.value = 1;
      this.vZoomSlider.value = 1;
      this.updateState({
        waveformData: new Float32Array(this.state.lastLoadedWaveformData),
        hZoom: 1,
        vZoom: 1,
        viewOffset: 0
      });
      this.draw();
    });
  }

  setupWaveformGenerationListeners() {
    if (!this.generateWaveformBtn || !this.waveformTypeSelect || !this.amplitudeInput || !this.cyclesInput || !this.dutyCycleInput) {
      return;
    }

    this.generateWaveformBtn.addEventListener('click', () => {
      const type = this.waveformTypeSelect.value;
      const amplitude = parseFloat(this.amplitudeInput.value);
      const cycles = parseInt(this.cyclesInput.value);
      const dutyCycle = parseInt(this.dutyCycleInput.value);

      if (isNaN(amplitude) || amplitude < 0 || amplitude > 1) {
        alert('Amplitude must be between 0 and 1.');
        return;
      }
      if (isNaN(cycles) || cycles < 1) {
        alert('Cycles must be a positive integer.');
        return;
      }
      if (type === 'square' && (isNaN(dutyCycle) || dutyCycle < 0 || dutyCycle > 100)) {
        alert('Duty Cycle must be between 0 and 100 for Square waves.');
        return;
      }

      let newWaveformData;
      switch (type) {
        case 'sine':
          newWaveformData = generateSineWave(amplitude, cycles, WAVEFORM_POINTS);
          break;
        case 'square':
          newWaveformData = generateSquareWave(amplitude, cycles, dutyCycle, WAVEFORM_POINTS);
          break;
        case 'triangle':
          newWaveformData = generateTriangleWave(amplitude, cycles, WAVEFORM_POINTS);
          break;
        default:
          return;
      }
      const updatedWaveformData = new Float32Array(this.state.waveformData);
      updatedWaveformData.set(newWaveformData);
      this.updateState({
        waveformData: updatedWaveformData,
        lastLoadedWaveformData: new Float32Array(updatedWaveformData)
      });
      this.draw();
    });
  }

  setupDeviceDownloadListener() {
    if (!this.downloadDeviceBtn) {
      return;
    }

    this.downloadDeviceBtn.addEventListener('click', () => {
      alert('Downloading to device is not yet implemented.');
    });
  }

  setupCanvas() {
    window.addEventListener('resize', this.draw);
    this.draw();
  }

  initializeEditMode() {
    this.updateState({ editMode: document.querySelector('input[name="edit-mode"]:checked').value });
  }

  initialize() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupCanvas();
    this.initializeEditMode();
  }

  getMouseHandlerCallbacks() {
    return {
      updateState: (newState) => {
        const updates = {};

        if (newState.viewOffset !== undefined) {
          const visiblePoints = WAVEFORM_POINTS / this.state.hZoom;
          const maxHOffset = Math.max(0, WAVEFORM_POINTS - visiblePoints);
          const clampedOffset = Math.max(0, Math.min(maxHOffset, newState.viewOffset));
          updates.viewOffset = clampedOffset;
        }
        if (newState.vShift !== undefined) {
          if (!this.canvas) {
            return;
          }
          const chartHeight = this.canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
          const maxPixelShift = (chartHeight / 2) * (this.state.vZoom - 1);
          const clampedShift = Math.max(-maxPixelShift, Math.min(maxPixelShift, newState.vShift));
          updates.vShift = clampedShift;
        }

        // Pass through any other properties (like waveformData) unchanged
        Object.keys(newState).forEach(key => {
          if (key !== 'viewOffset' && key !== 'vShift') {
            updates[key] = newState[key];
          }
        });

        this.updateState(updates);
      },
      updateZoom: (direction, newZoom) => {
        if (direction === 'h') {
          if (!this.hZoomSlider) {
            return;
          }
          newZoom = Math.max(parseFloat(this.hZoomSlider.min), Math.min(parseFloat(this.hZoomSlider.max), newZoom));
          this.hZoomSlider.value = newZoom;
          this.hZoomSlider.dispatchEvent(new Event('input'));
        } else if (direction === 'v') {
          if (!this.vZoomSlider) {
            return;
          }
          newZoom = Math.max(parseFloat(this.vZoomSlider.min), Math.min(parseFloat(this.vZoomSlider.max), newZoom));
          this.vZoomSlider.value = newZoom;
          this.vZoomSlider.dispatchEvent(new Event('input'));
        }
      },
      draw: () => this.draw()
    };
  }
}
