import { generateSineWave, generateSquareWave, generateTriangleWave, generateRampWave, generateExponentialWave, generateNoise } from './waveform-generator.js';
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
    this.minValueInput = null;
    this.cyclesInput = null;
    this.dutyCycleInput = null;
    this.generateWaveformBtn = null;
    this.downloadDeviceBtn = null;
    this.zoomResetBtn = null;
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
    this.editModeFreehand = document.getElementById('edit-mode-freehand');
    this.editModeLine = document.getElementById('edit-mode-line');
    this.drawStyleLine = document.getElementById('draw-style-line');
    this.drawStyleDots = document.getElementById('draw-style-dots');
    this.waveformTypeSelect = document.getElementById('waveform-type');
    this.amplitudeInput = document.getElementById('amplitude');
    this.minValueInput = document.getElementById('min-value');
    this.cyclesInput = document.getElementById('cycles');
    this.dutyCycleInput = document.getElementById('duty-cycle');
    this.generateWaveformBtn = document.getElementById('generate-waveform-btn');
    this.downloadDeviceBtn = document.getElementById('download-device-btn');
    this.zoomResetBtn = document.getElementById('zoom-reset-btn');
  }

  setupEventListeners() {
    this.setupShiftListeners();
    this.setupZoomListeners();
    this.setupZoomResetListener();
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
      const maxPixelShift = (chartHeight / 2) * Math.abs(this.state.vZoom - 1);
      this.updateState({ vShift: Math.max(-maxPixelShift, this.state.vShift - shiftAmount) });
      this.draw();
    });

    this.shiftDownBtn.addEventListener('click', () => {
      if (!this.canvas) {
        return;
      }
      const chartHeight = this.canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
      const shiftAmount = Math.max(1, Math.floor(chartHeight / 38));
      const maxPixelShift = (chartHeight / 2) * Math.abs(this.state.vZoom - 1);
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
      const maxPixelShift = (chartHeight / 2) * Math.abs(newVZoom - 1);
      this.updateState({
        vZoom: newVZoom,
        vShift: Math.max(-maxPixelShift, Math.min(maxPixelShift, this.state.vShift))
      });
      this.draw();
    });
  }

  setupZoomResetListener() {
    if (!this.zoomResetBtn) {
      return;
    }

    this.zoomResetBtn.addEventListener('click', () => {
      // Reset zoom sliders
      if (this.hZoomSlider) {
        this.hZoomSlider.value = 1;
      }
      if (this.vZoomSlider) {
        this.vZoomSlider.value = 1;
      }

      // Update state with reset zoom and offsets
      this.updateState({
        hZoom: 1,
        vZoom: 1,
        viewOffset: 0,
        vShift: 0
      });

      this.draw();
    });
  }

  setupDrawStyleListeners() {
    if (!this.drawStyleLine || !this.drawStyleDots) {
      return;
    }

    this.drawStyleLine.addEventListener('click', () => {
      this.updateState({ drawStyle: 'line' });
      this.drawStyleLine.classList.add('active');
      this.drawStyleDots.classList.remove('active');
      this.draw();
    });

    this.drawStyleDots.addEventListener('click', () => {
      this.updateState({ drawStyle: 'dots' });
      this.drawStyleDots.classList.add('active');
      this.drawStyleLine.classList.remove('active');
      this.draw();
    });
  }

  setupEditModeListeners() {
    if (!this.editModeFreehand || !this.editModeLine) {
      return;
    }

    this.editModeFreehand.addEventListener('click', () => {
      this.updateState({ editMode: 'freehand' });
      this.editModeFreehand.classList.add('active');
      this.editModeLine.classList.remove('active');
      this.mouseHandler.setEditMode(this.state.editMode);
    });

    this.editModeLine.addEventListener('click', () => {
      this.updateState({ editMode: 'line' });
      this.editModeLine.classList.add('active');
      this.editModeFreehand.classList.remove('active');
      this.mouseHandler.setEditMode(this.state.editMode);
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
    if (!this.generateWaveformBtn || !this.waveformTypeSelect || !this.amplitudeInput || !this.minValueInput || !this.cyclesInput || !this.dutyCycleInput) {
      return;
    }

    this.generateWaveformBtn.addEventListener('click', () => {
      const type = this.waveformTypeSelect.value;
      const max = parseFloat(this.amplitudeInput.value);
      const min = parseFloat(this.minValueInput.value);
      const cycles = parseInt(this.cyclesInput.value);
      const dutyCycle = parseInt(this.dutyCycleInput.value);

      if (isNaN(max) || max < -1 || max > 1) {
        alert('Max value must be between -1 and 1.');
        return;
      }
      if (isNaN(min) || min < -1 || min > 1) {
        alert('Min value must be between -1 and 1.');
        return;
      }
      if (min >= max) {
        alert('Min must be less than Max.');
        return;
      }
      if (isNaN(cycles) || cycles < 1) {
        alert('Cycles must be a positive integer.');
        return;
      }
      if ((type === 'square' || type === 'triangle' || type === 'ramp' || type === 'ramp-down' || type === 'exponential' || type === 'exponential-down') && (isNaN(dutyCycle) || dutyCycle < 0 || dutyCycle > 100)) {
        alert('Duty Cycle must be between 0 and 100 for Square, Triangle, Ramp, and Exponential waves.');
        return;
      }

      let newWaveformData;
      switch (type) {
        case 'sine':
          newWaveformData = generateSineWave(min, max, cycles);
          break;
        case 'square':
          newWaveformData = generateSquareWave(min, max, cycles, dutyCycle);
          break;
        case 'triangle':
          newWaveformData = generateTriangleWave(min, max, cycles, dutyCycle);
          break;
        case 'ramp':
          newWaveformData = generateRampWave(min, max, cycles, 'up', dutyCycle);
          break;
        case 'ramp-down':
          newWaveformData = generateRampWave(min, max, cycles, 'down', dutyCycle);
          break;
        case 'exponential':
          newWaveformData = generateExponentialWave(min, max, cycles, 'up', dutyCycle);
          break;
        case 'exponential-down':
          newWaveformData = generateExponentialWave(min, max, cycles, 'down', dutyCycle);
          break;
        case 'noise':
          newWaveformData = generateNoise(min, max);
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

  destroy() {
    window.removeEventListener('resize', this.draw);
    if (this.mouseHandler) {
      this.mouseHandler.destroy();
    }
  }

  initializeEditMode() {
    if (this.editModeFreehand && this.editModeLine) {
      if (this.state.editMode === 'freehand') {
        this.editModeFreehand.classList.add('active');
        this.editModeLine.classList.remove('active');
      } else {
        this.editModeLine.classList.add('active');
        this.editModeFreehand.classList.remove('active');
      }
    }
  }

  initializeDrawStyle() {
    if (this.drawStyleLine && this.drawStyleDots) {
      if (this.state.drawStyle === 'line') {
        this.drawStyleLine.classList.add('active');
        this.drawStyleDots.classList.remove('active');
      } else {
        this.drawStyleDots.classList.add('active');
        this.drawStyleLine.classList.remove('active');
      }
    }
  }

  initialize() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupCanvas();
    this.initializeEditMode();
    this.initializeDrawStyle();
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
          if (this.canvas) {
            const chartHeight = this.canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
            const maxPixelShift = (chartHeight / 2) * Math.abs(this.state.vZoom - 1);
            const clampedShift = Math.max(-maxPixelShift, Math.min(maxPixelShift, newState.vShift));
            updates.vShift = clampedShift;
          } else {
            updates.vShift = newState.vShift;
          }
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
