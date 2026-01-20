import { generateSineWave, generateSquareWave, generateTriangleWave } from './src/js/waveform-generator.js';
import { getMousePos } from './src/js/utils.js';
import { CanvasDrawer } from './src/js/canvas-drawer.js';
import { MouseHandler } from './src/js/mouse-handler.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('waveform-canvas');
    const openBtn = document.getElementById('open-btn');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const hZoomSlider = document.getElementById('h-zoom');
    const vZoomSlider = document.getElementById('v-zoom');
    const shiftLeftBtn = document.getElementById('shift-left-btn');
    const shiftRightBtn = document.getElementById('shift-right-btn');
    const shiftUpBtn = document.getElementById('shift-up-btn');
    const shiftDownBtn = document.getElementById('shift-down-btn');
    const drawStyleLine = document.getElementById('draw-style-line');
    const drawStyleDots = document.getElementById('draw-style-dots');
    const waveformTypeSelect = document.getElementById('waveform-type');
    const amplitudeInput = document.getElementById('amplitude');
    const cyclesInput = document.getElementById('cycles');
    const dutyCycleInput = document.getElementById('duty-cycle');
    const generateWaveformBtn = document.getElementById('generate-waveform-btn');
    const downloadDeviceBtn = document.getElementById('download-device-btn');

    const WAVEFORM_POINTS = 4096;
    const TOP_PADDING = 20; // For 100% label
    const RIGHT_PADDING = 20; // For 4095 label
    const BOTTOM_PADDING = 30; // For X-axis labels
    const LEFT_PADDING = 50; // For Y-axis labels
    const initialWaveformData = new Float32Array(WAVEFORM_POINTS).fill(0.0);
    let lastLoadedWaveformData = new Float32Array(initialWaveformData);
    let waveformData = new Float32Array(initialWaveformData);

    const canvasDrawer = new CanvasDrawer(canvas, {
        WAVEFORM_POINTS,
        TOP_PADDING,
        RIGHT_PADDING,
        BOTTOM_PADDING,
        LEFT_PADDING
    });

    let hZoom = 1;
    let vZoom = 1;
    let viewOffset = 0; // The starting point of the waveform data to display
    let vShift = 0;
    let drawStyle = 'line';
    let editMode = document.querySelector('input[name="edit-mode"]:checked').value;

    const state = {
        waveformData,
        hZoom,
        vZoom,
        viewOffset,
        vShift,
        drawStyle,
        editMode,
        WAVEFORM_POINTS,
        TOP_PADDING,
        RIGHT_PADDING,
        BOTTOM_PADDING,
        LEFT_PADDING,
    };

    const mouseHandler = new MouseHandler(canvas, state, {
        updateState: (newState) => {
            if (newState.viewOffset !== undefined) {
                const visiblePoints = WAVEFORM_POINTS / hZoom;
                const maxHOffset = Math.max(0, WAVEFORM_POINTS - visiblePoints);
                viewOffset = Math.max(0, Math.min(maxHOffset, newState.viewOffset));
                state.viewOffset = viewOffset;
            }
            if (newState.vShift !== undefined) {
                const chartHeight = canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
                const maxPixelShift = (chartHeight / 2) * (vZoom - 1);
                vShift = Math.max(-maxPixelShift, Math.min(maxPixelShift, newState.vShift));
                state.vShift = vShift;
            }
        },
        updateZoom: (direction, newZoom) => {
            if (direction === 'h') {
                newZoom = Math.max(parseFloat(hZoomSlider.min), Math.min(parseFloat(hZoomSlider.max), newZoom));
                hZoomSlider.value = newZoom;
                hZoomSlider.dispatchEvent(new Event('input'));
            } else if (direction === 'v') {
                newZoom = Math.max(parseFloat(vZoomSlider.min), Math.min(parseFloat(vZoomSlider.max), newZoom));
                vZoomSlider.value = newZoom;
                vZoomSlider.dispatchEvent(new Event('input'));
            }
        },
        draw,
    });

    // --- Canvas and Drawing ---

    function setupCanvas() {
        // The canvas size is now controlled by CSS.
        // We add a resize listener to handle initial sizing and subsequent resizes.
        window.addEventListener('resize', draw);
        // Initial draw
        draw();
    }

    function draw() {
        state.waveformData = waveformData;
        state.hZoom = hZoom;
        state.vZoom = vZoom;
        state.viewOffset = viewOffset;
        state.vShift = vShift;
        state.drawStyle = drawStyle;
        canvasDrawer.draw(state);
    }

    // --- Event Listeners ---

    shiftLeftBtn.addEventListener('click', () => {
        const visiblePoints = WAVEFORM_POINTS / hZoom;
        const shiftAmount = Math.max(1, Math.floor(visiblePoints / 10)); // Shift by 10% of visible or at least 1
        viewOffset = Math.max(0, viewOffset - shiftAmount);
        draw();
    });

    shiftRightBtn.addEventListener('click', () => {
        const visiblePoints = WAVEFORM_POINTS / hZoom;
        const shiftAmount = Math.max(1, Math.floor(visiblePoints / 10));
        const maxOffset = Math.max(0, WAVEFORM_POINTS - visiblePoints);
        viewOffset = Math.min(maxOffset, viewOffset + shiftAmount);
        draw();
    });

    shiftUpBtn.addEventListener("click", () => {
        const chartHeight = canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
        const shiftAmount = Math.max(1, Math.floor(chartHeight / 38));
        const maxPixelShift = (chartHeight / 2) * (vZoom - 1);
        vShift = Math.max(-maxPixelShift, vShift - shiftAmount);
        draw();
    });
  
    shiftDownBtn.addEventListener("click", () => {
        const chartHeight = canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
        const shiftAmount = Math.max(1, Math.floor(chartHeight / 38));
        const maxPixelShift = (chartHeight / 2) * (vZoom - 1);
        vShift = Math.min(maxPixelShift, vShift + shiftAmount);
        draw();
    });
    
    hZoomSlider.addEventListener('input', (e) => {
        const oldHZoom = hZoom;
        const newHZoom = parseFloat(e.target.value);

        const visiblePointsOld = WAVEFORM_POINTS / oldHZoom;
        const visiblePointsNew = WAVEFORM_POINTS / newHZoom;

        const centerPoint = viewOffset + visiblePointsOld / 2;

        let newViewOffset = centerPoint - visiblePointsNew / 2;

        const maxOffset = Math.max(0, WAVEFORM_POINTS - visiblePointsNew);
        newViewOffset = Math.max(0, Math.min(maxOffset, newViewOffset));

        hZoom = newHZoom;
        viewOffset = newViewOffset;
        draw();
    });

    vZoomSlider.addEventListener('input', (e) => {
        vZoom = parseFloat(e.target.value);
        const chartHeight = canvas.clientHeight - (TOP_PADDING + BOTTOM_PADDING);
        const maxPixelShift = (chartHeight / 2) * (vZoom - 1);
        vShift = Math.max(-maxPixelShift, Math.min(maxPixelShift, vShift));
        draw();
    });

    drawStyleLine.addEventListener('change', () => {
        drawStyle = 'line';
        draw();
    });

    drawStyleDots.addEventListener('change', () => {
        drawStyle = 'dots';
        draw();
    });

    document.querySelectorAll('input[name="edit-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            editMode = e.target.value;
            mouseHandler.setEditMode(editMode);
        });
    });

    openBtn.addEventListener('click', async () => {
        const fileContent = await window.electronAPI.openFile();
        if (fileContent !== undefined && fileContent !== null) {
            const lines = fileContent.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
                const numericData = lines.map(line => parseFloat(line.trim()));

                if (numericData.some(isNaN)) {
                    alert('Error: File contains non-numeric values.');
                    return;
                }

                const finalData = new Float32Array(WAVEFORM_POINTS); // Inits with 0.0

                const clampedData = numericData.slice(0, WAVEFORM_POINTS).map(val => Math.max(-1.0, Math.min(1.0, val)));
                finalData.set(clampedData);

                waveformData = finalData;
                lastLoadedWaveformData = new Float32Array(finalData);
                
                // Reset zoom and pan on new file
                hZoom = 1;
                hZoomSlider.value = 1;
                vZoom = 1;
                vZoomSlider.value = 1;
                viewOffset = 0;

                draw();
            }
        }
    });

    saveBtn.addEventListener('click', async () => {
        const dataString = Array.from(waveformData).join('\n');
        await window.electronAPI.saveFile(dataString);
    });

    resetBtn.addEventListener('click', () => {
        waveformData = new Float32Array(lastLoadedWaveformData);
        hZoom = 1;
        hZoomSlider.value = 1;
        vZoom = 1;
        vZoomSlider.value = 1;
        viewOffset = 0;
        draw();
    });

    generateWaveformBtn.addEventListener('click', () => {
        const type = waveformTypeSelect.value;
        const amplitude = parseFloat(amplitudeInput.value);
        const cycles = parseInt(cyclesInput.value);
        const dutyCycle = parseInt(dutyCycleInput.value);

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
                console.error('Unknown waveform type:', type);
                return;
        }
        waveformData.set(newWaveformData);
        lastLoadedWaveformData = new Float32Array(waveformData);
        draw();
    });

    downloadDeviceBtn.addEventListener('click', () => {
        alert('Downloading to device is not yet implemented.');
    });

    // --- Initial Setup ---
    setupCanvas();
});
