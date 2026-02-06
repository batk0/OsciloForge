import { getMousePos } from './api/utils.js';
import { CanvasDrawer } from './api/canvas-drawer.js';
import { MouseHandler } from './api/mouse-handler.js';
import { UIManager } from './api/ui-manager.js';
import { state, updateState, WAVEFORM_POINTS, TOP_PADDING, RIGHT_PADDING, BOTTOM_PADDING, LEFT_PADDING } from './api/state.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('waveform-canvas');
    
    // Initialize core components
    const canvasDrawer = new CanvasDrawer(canvas);
    
    // Create UIManager instance with dependencies
    const uiManager = new UIManager(state, updateState, canvasDrawer, null, null);
    
    // Create MouseHandler with UIManager callbacks
    const mouseHandler = new MouseHandler(canvas, state, uiManager.getMouseHandlerCallbacks());

    // Update UIManager with the mouseHandler and draw function
    uiManager.mouseHandler = mouseHandler;
    uiManager.draw = () => canvasDrawer.draw(state);

    // --- Canvas and Drawing ---

    function setupCanvas() {
        // The canvas size is now controlled by CSS.
        // We add a resize listener to handle initial sizing and subsequent resizes.
        window.addEventListener('resize', uiManager.draw);
        // Initial draw
        uiManager.draw();
    }

    // --- Initial Setup ---
    uiManager.initialize();
    setupCanvas();
});
