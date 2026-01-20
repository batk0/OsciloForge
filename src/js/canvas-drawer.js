import { getNiceTickInterval } from './utils.js';

export class CanvasDrawer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.WAVEFORM_POINTS = options.WAVEFORM_POINTS || 4096;
        this.TOP_PADDING = options.TOP_PADDING || 20;
        this.RIGHT_PADDING = options.RIGHT_PADDING || 20;
        this.BOTTOM_PADDING = options.BOTTOM_PADDING || 30;
        this.LEFT_PADDING = options.LEFT_PADDING || 50;
    }

    draw(state) {
        const {
            waveformData, hZoom, vZoom, viewOffset, vShift, drawStyle
        } = state;

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        if (this.canvas.width <= (this.LEFT_PADDING + this.RIGHT_PADDING) || this.canvas.height <= (this.TOP_PADDING + this.BOTTOM_PADDING)) {
            return; // Don't draw if we have no space
        }

        const chartWidth = this.canvas.width - (this.LEFT_PADDING + this.RIGHT_PADDING);
        const chartHeight = this.canvas.height - (this.TOP_PADDING + this.BOTTOM_PADDING);

        const vCenter = chartHeight / 2 + vShift;
        const vScale = (chartHeight / 2) * vZoom;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawAxesAndGrid(chartWidth, chartHeight, hZoom, vZoom, viewOffset, vShift);
        
        this.ctx.save();
        this.ctx.translate(this.LEFT_PADDING, this.TOP_PADDING); // Translate by left and top padding
        this.ctx.beginPath();
        this.ctx.rect(0, 0, chartWidth, chartHeight);
        this.ctx.clip();

        const visiblePoints = this.WAVEFORM_POINTS / hZoom;
        const startPoint = Math.floor(viewOffset);
        const endPoint = Math.min(startPoint + Math.ceil(visiblePoints) + 1, this.WAVEFORM_POINTS);
        const localXScale = chartWidth / visiblePoints;

        if (drawStyle === 'line') {
            this.ctx.strokeStyle = '#ff0000'; // Red
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            for (let i = startPoint; i < endPoint; i++) {
                const x = (i - viewOffset) * localXScale;
                const y = vCenter - (waveformData[i] * vScale);
                if (i === startPoint) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        } else if (drawStyle === 'dots') {
            this.ctx.fillStyle = '#ff0000'; // Red
            for (let i = startPoint; i < endPoint; i++) {
                const x = (i - viewOffset) * localXScale;
                const y = vCenter - (waveformData[i] * vScale);
                if (x >= 0 && x <= chartWidth) {
                    this.ctx.fillRect(x - 1, y - 1, 2, 2);
                }
            }
        }
        this.ctx.restore();
    }

    drawAxesAndGrid(chartWidth, chartHeight, hZoom, vZoom, viewOffset, vShift) {
        const axisColor = '#f0f0f0';
        const gridColor = '#444';
        const textColor = '#f0f0f0';
        const vCenter = chartHeight / 2 + vShift;
        const vScale = (chartHeight / 2) * vZoom;
        
        this.ctx.font = '12px sans-serif';

        // --- Y-Axis and Horizontal Grid ---
        const valueTop = (vCenter - 0) / vScale;
        const valueBottom = (vCenter - chartHeight) / vScale;
        const visibleValueRange = valueTop - valueBottom;

        // Target around 8-10 major grid lines
        const yMajorTickInterval = getNiceTickInterval(visibleValueRange * 100, 8);
        const yMinorTickInterval = yMajorTickInterval / 5;

        const firstTick = Math.floor(valueBottom * 100 / yMinorTickInterval) * yMinorTickInterval;
        const lastTick = Math.ceil(valueTop * 100 / yMinorTickInterval) * yMinorTickInterval;

        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 1;
        
        for (let p = firstTick; p <= lastTick; p += yMinorTickInterval) {
            const pRounded = parseFloat(p.toPrecision(10));
            if (pRounded > valueTop * 100 || pRounded < valueBottom * 100) continue;

            const value = pRounded / 100;
            const y = this.TOP_PADDING + vCenter - (value * vScale);

            const isMajorTick = Math.abs(pRounded % yMajorTickInterval) < 1e-9 || Math.abs(pRounded - yMajorTickInterval) % yMajorTickInterval < 1e-9;

            this.ctx.beginPath();
            this.ctx.moveTo(this.LEFT_PADDING, y);
            this.ctx.lineTo(this.LEFT_PADDING + (isMajorTick ? 8 : 5), y);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(this.LEFT_PADDING + chartWidth - (isMajorTick ? 8 : 5), y);
            this.ctx.lineTo(this.LEFT_PADDING + chartWidth, y);
            this.ctx.stroke();

            if (isMajorTick) {
                this.ctx.fillStyle = gridColor;
                for (let j = 0; j <= 40; j++) {
                    const x = this.LEFT_PADDING + (j / 40) * chartWidth;
                    this.ctx.fillRect(x - 1, y - 1, 2, 2);
                }
                
                this.ctx.fillStyle = textColor;
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${pRounded}%`, this.LEFT_PADDING - 10, y);
            }
        }

        // --- Fixed Frame Axes ---
        this.ctx.beginPath();
        this.ctx.moveTo(this.LEFT_PADDING, this.TOP_PADDING);
        this.ctx.lineTo(this.LEFT_PADDING, this.TOP_PADDING + chartHeight);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.LEFT_PADDING + chartWidth, this.TOP_PADDING);
        this.ctx.lineTo(this.LEFT_PADDING + chartWidth, this.TOP_PADDING + chartHeight);
        this.ctx.stroke();
        
        // --- X-Axis and Vertical Grid ---
        const xMajorTickInterval = 5;
        const xTickCount = 41;
        
        this.ctx.strokeStyle = axisColor;

        this.ctx.beginPath();
        this.ctx.moveTo(this.LEFT_PADDING, this.TOP_PADDING);
        this.ctx.lineTo(this.LEFT_PADDING + chartWidth, this.TOP_PADDING);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.LEFT_PADDING, this.TOP_PADDING + vCenter);
        this.ctx.lineTo(this.LEFT_PADDING + chartWidth, this.TOP_PADDING + vCenter);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.LEFT_PADDING, this.TOP_PADDING + chartHeight);
        this.ctx.lineTo(this.LEFT_PADDING + chartWidth, this.TOP_PADDING + chartHeight);
        this.ctx.stroke();

        for (let i = 0; i < xTickCount; i++) {
            const x = this.LEFT_PADDING + (i / (xTickCount - 1)) * chartWidth;
            
            const visiblePoints = this.WAVEFORM_POINTS / hZoom;
            const pointValue = Math.round(viewOffset + (i / (xTickCount - 1)) * visiblePoints);
            const clampedPointValue = Math.min(pointValue, this.WAVEFORM_POINTS - 1);

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.TOP_PADDING);
            this.ctx.lineTo(x, this.TOP_PADDING + 5);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.TOP_PADDING + vCenter - 5);
            this.ctx.lineTo(x, this.TOP_PADDING + vCenter + 5);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.TOP_PADDING + chartHeight - 5);
            this.ctx.lineTo(x, this.TOP_PADDING + chartHeight);
            this.ctx.stroke();

            if (i % xMajorTickInterval === 0) {
                this.ctx.fillStyle = gridColor;
                for (let j = 0; j <= 40; j++) {
                    const y = this.TOP_PADDING + (j / 40) * chartHeight;
                    this.ctx.fillRect(x - 1, y - 1, 2, 2);
                }
                this.ctx.fillStyle = textColor;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(clampedPointValue, x, this.TOP_PADDING + chartHeight + 10);
            }
        }
    }
}
