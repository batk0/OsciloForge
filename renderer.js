document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('waveform-canvas');
    const ctx = canvas.getContext('2d');

    const openBtn = document.getElementById('open-btn');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const hZoomSlider = document.getElementById('h-zoom');
    const vZoomSlider = document.getElementById('v-zoom');
    const drawStyleLine = document.getElementById('draw-style-line');
    const drawStyleDots = document.getElementById('draw-style-dots');
    const waveformTypeSelect = document.getElementById('waveform-type');
    const amplitudeInput = document.getElementById('amplitude');
    const cyclesInput = document.getElementById('cycles');
    const dutyCycleInput = document.getElementById('duty-cycle');
    const generateWaveformBtn = document.getElementById('generate-waveform-btn');
    const downloadDeviceBtn = document.getElementById('download-device-btn');

    const WAVEFORM_POINTS = 4096;
    const AXIS_PADDING = 50; // Space for axis labels
    const initialWaveformData = new Float32Array(WAVEFORM_POINTS).fill(0.0);
    let lastLoadedWaveformData = new Float32Array(initialWaveformData);
    let waveformData = new Float32Array(initialWaveformData);

    let hZoom = 1;
    let vZoom = 1;
    let drawStyle = 'line';

    let isDrawing = false;
    let lastPoint = { x: -1, y: -1 };
    let editMode = document.querySelector('input[name="edit-mode"]:checked').value;
    let lineStartPoint = null; // For line drawing mode

    // --- Canvas and Drawing ---

    function setupCanvas() {
        // The canvas size is now controlled by CSS.
        // We add a resize listener to handle initial sizing and subsequent resizes.
        window.addEventListener('resize', draw);
        // Initial draw
        draw();
    }

    function draw() {
        // Match the drawing buffer to the displayed size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        if (canvas.width <= AXIS_PADDING || canvas.height <= AXIS_PADDING) {
            return; // Don't draw if we have no space
        }

        const chartWidth = canvas.width - AXIS_PADDING;
        const chartHeight = canvas.height - AXIS_PADDING;

        const vCenter = chartHeight / 2;
        const vScale = (chartHeight / 2) * vZoom;
        const xScale = (chartWidth / WAVEFORM_POINTS) * hZoom;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawAxesAndGrid(chartWidth, chartHeight);
        
        ctx.save();
        ctx.translate(AXIS_PADDING, 0);

        if (drawStyle === 'line') {
            ctx.strokeStyle = '#ff0000'; // Red
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < WAVEFORM_POINTS; i++) {
                const x = i * xScale;
                const y = vCenter - (waveformData[i] * vScale);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else if (drawStyle === 'dots') {
            ctx.fillStyle = '#ff0000'; // Red
            for (let i = 0; i < WAVEFORM_POINTS; i++) {
                const x = i * xScale;
                const y = vCenter - (waveformData[i] * vScale);
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
        ctx.restore();
    }

    function drawAxesAndGrid(chartWidth, chartHeight) {
        const axisColor = '#f0f0f0';
        const gridColor = '#444';
        const textColor = '#f0f0f0';
        
        ctx.font = '12px sans-serif';
        
        // --- Y-Axis and Horizontal Grid ---
        const yTickCount = 11; // 100%, 80%, ..., -100%
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(AXIS_PADDING, 0); // Left edge of chart area
        ctx.lineTo(AXIS_PADDING, chartHeight);
        ctx.stroke();

        for (let i = 0; i < yTickCount; i++) {
            const y = (i / (yTickCount - 1)) * chartHeight;
            const percentage = 100 - (i * (200 / (yTickCount - 1))); // From 100 down to -100

            // Draw Tick
            ctx.beginPath();
            ctx.moveTo(AXIS_PADDING - 5, y);
            ctx.lineTo(AXIS_PADDING, y);
            ctx.stroke();

            // Draw Grid Line and Label for major ticks
            if (i % 2 === 0) { // Major ticks every 2nd (e.g., 100, 60, 20, -20, -60, -100)
                ctx.strokeStyle = gridColor;
                ctx.beginPath();
                ctx.moveTo(AXIS_PADDING, y);
                ctx.lineTo(canvas.width, y); // Span full canvas width
                ctx.stroke();
                
                ctx.fillStyle = textColor;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${percentage}%`, AXIS_PADDING - 10, y);
            }
            ctx.strokeStyle = axisColor; // Reset for minor ticks
        }
        
        // --- X-Axis and Vertical Grid ---
        const xScale = (chartWidth / WAVEFORM_POINTS) * hZoom; // Using the responsive xScale
        const xTickCount = 11; // For 0 to 4095
        
        ctx.strokeStyle = axisColor;
        ctx.beginPath();
        ctx.moveTo(AXIS_PADDING, chartHeight / 2); // X-axis at vertical center
        ctx.lineTo(canvas.width, chartHeight / 2);
        ctx.stroke();

        for (let i = 0; i < xTickCount; i++) {
            const x = AXIS_PADDING + (i / (xTickCount - 1)) * chartWidth; // Position relative to chartWidth
            const pointValue = Math.round((i / (xTickCount - 1)) * (WAVEFORM_POINTS - 1));

            // Draw Tick
            ctx.beginPath();
            ctx.moveTo(x, chartHeight / 2); // Start at central X-axis
            ctx.lineTo(x, chartHeight / 2 + 5); // Extend downwards
            ctx.stroke();

            // Draw Grid Line and Label for major ticks
            if (i % 2 === 0) { // Major ticks every 2nd (e.g., 0, 819, 1638, ...)
                ctx.strokeStyle = gridColor;
                ctx.beginPath();
                ctx.moveTo(x, 0); // Span full height
                ctx.lineTo(x, chartHeight);
                ctx.stroke();

                ctx.fillStyle = textColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(pointValue, x, chartHeight / 2 + 10); // Label below central X-axis
            }
            ctx.strokeStyle = axisColor; // Reset for minor ticks
        }
    }

    function generateSineWave(amplitude, cycles) {
        for (let i = 0; i < WAVEFORM_POINTS; i++) {
            waveformData[i] = amplitude * Math.sin(2 * Math.PI * cycles * (i / WAVEFORM_POINTS));
        }
    }

    function generateSquareWave(amplitude, cycles, dutyCycle) {
        const periodPoints = WAVEFORM_POINTS / cycles;
        const dutyPoints = periodPoints * (dutyCycle / 100);
        for (let i = 0; i < WAVEFORM_POINTS; i++) {
            const phaseInPeriod = i % periodPoints;
            waveformData[i] = phaseInPeriod < dutyPoints ? amplitude : -amplitude;
        }
    }

    function generateTriangleWave(amplitude, cycles) {
        const periodPoints = WAVEFORM_POINTS / cycles;
        for (let i = 0; i < WAVEFORM_POINTS; i++) {
            const phaseInPeriod = i % periodPoints;
            if (phaseInPeriod < periodPoints / 2) {
                waveformData[i] = amplitude * (2 * (phaseInPeriod / (periodPoints / 2)) - 1);
            } else {
                waveformData[i] = amplitude * (1 - 2 * ((phaseInPeriod - periodPoints / 2) / (periodPoints / 2)));
            }
        }
    }

    // --- Mouse Editing ---

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function handleFreehandDraw(event) {
        if (!isDrawing) return;
        
        const chartWidth = canvas.width - AXIS_PADDING;
        const chartHeight = canvas.height - AXIS_PADDING;
        const xScale = (chartWidth / WAVEFORM_POINTS) * hZoom;
        const mousePos = getMousePos(event);
        const currentPointX = Math.floor((mousePos.x - AXIS_PADDING) / xScale);

        if (currentPointX >= 0 && currentPointX < WAVEFORM_POINTS) {
            const vCenter = chartHeight / 2;
            const vScale = (chartHeight / 2) * vZoom;
            let value = (vCenter - mousePos.y) / vScale;
            value = Math.max(-1.0, Math.min(1.0, value));

            if (lastPoint.x !== -1 && lastPoint.x !== currentPointX) {
                const startX = Math.min(lastPoint.x, currentPointX);
                const endX = Math.max(lastPoint.x, currentPointX);
                const startY = (lastPoint.x < currentPointX) ? lastPoint.y : value;
                const endY = (lastPoint.x < currentPointX) ? value : lastPoint.y;
                for (let i = startX; i <= endX; i++) {
                    if (i < waveformData.length) {
                       const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
                       waveformData[i] = startY + t * (endY - startY);
                    }
                }
            } else {
                waveformData[currentPointX] = value;
            }
            
            lastPoint = { x: currentPointX, y: value };
            draw();
        }
    }

    function handleLineDraw(event) {
        const chartWidth = canvas.width - AXIS_PADDING;
        const chartHeight = canvas.height - AXIS_PADDING;
        const xScale = (chartWidth / WAVEFORM_POINTS) * hZoom;
        const mousePos = getMousePos(event);
        const currentPointX = Math.floor((mousePos.x - AXIS_PADDING) / xScale);

        if (currentPointX >= 0 && currentPointX < WAVEFORM_POINTS) {
            const vCenter = chartHeight / 2;
            const vScale = (chartHeight / 2) * vZoom;
            let value = (vCenter - mousePos.y) / vScale;
            value = Math.max(-1.0, Math.min(1.0, value));

            if (!lineStartPoint) {
                lineStartPoint = { x: currentPointX, y: value };
            } else {
                const startX = Math.min(lineStartPoint.x, currentPointX);
                const endX = Math.max(lineStartPoint.x, currentPointX);
                const startY_val = (lineStartPoint.x < currentPointX) ? lineStartPoint.y : value;
                const endY_val = (lineStartPoint.x < currentPointX) ? value : lineStartPoint.y;
                for (let i = startX; i <= endX; i++) {
                    if (i < waveformData.length) {
                        const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
                        waveformData[i] = startY_val + t * (endY_val - startY_val);
                    }
                }
                lineStartPoint = { x: currentPointX, y: value };
                draw();
            }
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (editMode === 'freehand') {
            isDrawing = true;
            handleFreehandDraw(e); 
        } else if (editMode === 'line') {
            handleLineDraw(e); // handleLineDraw manages its own state
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (editMode === 'freehand') {
            isDrawing = false;
            lastPoint = { x: -1, y: -1 };
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (editMode === 'freehand') {
            isDrawing = false;
            lastPoint = { x: -1, y: -1 };
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (editMode === 'freehand') {
            handleFreehandDraw(e);
        }
        // Line drawing doesn't need mousemove for drawing itself, only for visual feedback if implemented.
    });

    canvas.addEventListener('contextmenu', (e) => {
        if (editMode === 'line') {
            e.preventDefault(); // Prevent the browser's context menu
            lineStartPoint = null; // Clear the starting point
        }
    });

    // --- Event Listeners ---

    hZoomSlider.addEventListener('input', (e) => {
        hZoom = parseFloat(e.target.value);
        draw();
    });

    vZoomSlider.addEventListener('input', (e) => {
        vZoom = parseFloat(e.target.value);
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
            lineStartPoint = null; // Reset line drawing on mode change
            isDrawing = false; // Stop any ongoing drawing
            lastPoint = { x: -1, y: -1 }; // Reset last point
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

                // Copy the loaded data, truncating or padding as necessary.
                const clampedData = numericData.slice(0, WAVEFORM_POINTS).map(val => Math.max(-1.0, Math.min(1.0, val)));
                finalData.set(clampedData);

                waveformData = finalData;
                lastLoadedWaveformData = new Float32Array(finalData);
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
        draw();
    });

    generateWaveformBtn.addEventListener('click', () => {
        const type = waveformTypeSelect.value;
        const amplitude = parseFloat(amplitudeInput.value);
        const cycles = parseInt(cyclesInput.value);
        const dutyCycle = parseInt(dutyCycleInput.value);

        // Input validation
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

        switch (type) {
            case 'sine':
                generateSineWave(amplitude, cycles);
                break;
            case 'square':
                generateSquareWave(amplitude, cycles, dutyCycle);
                break;
            case 'triangle':
                generateTriangleWave(amplitude, cycles);
                break;
            default:
                console.error('Unknown waveform type:', type);
                return;
        }
        lastLoadedWaveformData = new Float32Array(waveformData); // Update last loaded for reset
        draw();
    });

    downloadDeviceBtn.addEventListener('click', () => {
        alert('Downloading to device is not yet implemented.');
    });

    // --- Initial Setup ---
    setupCanvas();
});
