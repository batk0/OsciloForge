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

    const WAVEFORM_POINTS = 4096;
    const CANVAS_HEIGHT = 400;
    const initialWaveformData = new Float32Array(WAVEFORM_POINTS).fill(0.5);
    let lastLoadedWaveformData = new Float32Array(initialWaveformData);
    let waveformData = new Float32Array(initialWaveformData);

    let hZoom = 1;
    let vZoom = 1;
    let drawStyle = 'line';

    let isDrawing = false;
    let lastPoint = { x: -1, y: -1 };

    // --- Canvas and Drawing ---

    function setupCanvas() {
        canvas.height = CANVAS_HEIGHT;
        draw();
    }

    function draw() {
        const canvasWidth = WAVEFORM_POINTS * hZoom;
        canvas.width = canvasWidth; // This also clears the canvas

        const vCenter = CANVAS_HEIGHT / 2;
        const vScale = (CANVAS_HEIGHT / 2) * vZoom;

        if (drawStyle === 'line') {
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 1.5; // Make it a bit thicker
            ctx.beginPath();
            for (let i = 0; i < WAVEFORM_POINTS; i++) {
                // Use the center of the pixel for x coordinate
                const x = (i + 0.5) * hZoom;
                const y = vCenter - (waveformData[i] - 0.5) * vScale;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        } else if (drawStyle === 'dots') {
            ctx.fillStyle = '#007bff';
            for (let i = 0; i < WAVEFORM_POINTS; i++) {
                const x = (i + 0.5) * hZoom;
                const y = vCenter - (waveformData[i] - 0.5) * vScale;
                ctx.fillRect(x - 1, y - 1, 2, 2); // Draw a 2x2 dot
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

    function handleDraw(event) {
        if (!isDrawing) return;

        const mousePos = getMousePos(event);
        const currentPointX = Math.floor(mousePos.x / hZoom);

        if (currentPointX >= 0 && currentPointX < WAVEFORM_POINTS) {
            const vCenter = CANVAS_HEIGHT / 2;
            const vScale = (CANVAS_HEIGHT / 2) * vZoom;
            let value = (vCenter - mousePos.y) / vScale + 0.5;
            value = Math.max(0, Math.min(1, value)); // Clamp

            // Interpolate between the last point and the current point to draw a smooth line
            if (lastPoint.x !== -1 && lastPoint.x !== currentPointX) {
                const startX = Math.min(lastPoint.x, currentPointX);
                const endX = Math.max(lastPoint.x, currentPointX);
                const startY = (lastPoint.x < currentPointX) ? lastPoint.y : value;
                const endY = (lastPoint.x < currentPointX) ? value : lastPoint.y;

                for (let i = startX; i <= endX; i++) {
                    const t = (endX - startX === 0) ? 1.0 : (i - startX) / (endX - startX);
                    waveformData[i] = startY + t * (endY - startY);
                }
            } else {
                waveformData[currentPointX] = value;
            }
            
            lastPoint = { x: currentPointX, y: value };
            draw();
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        // The rest is handled by handleDraw on mousemove, but we call it once to draw a single dot on click
        handleDraw(e); 
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        lastPoint = { x: -1, y: -1 };
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
        lastPoint = { x: -1, y: -1 };
    });

    canvas.addEventListener('mousemove', handleDraw);

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
                finalData.set(numericData.slice(0, WAVEFORM_POINTS));

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

    // --- Initial Setup ---
    setupCanvas();
});
