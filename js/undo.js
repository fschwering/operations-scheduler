// js/undo.js

const MAX_UNDO_STACK = 50;
const undoStack = [];
const redoStack = [];
let lastSavedState = null;

// Deep clone helper
function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}

// Initialize the undo system with the current state
function initUndo(initialState) {
    lastSavedState = cloneState(initialState);
    undoStack.length = 0;
    redoStack.length = 0;
    updateUndoButtons();
}

// Push a state to the undo stack
function pushUndoState(state) {
    undoStack.push(cloneState(state));
    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }
    // When we push a new undo state (new action), we must clear redo stack
    // UNLESS this push is coming from a Redo operation itself.
    // But snapshotStateIfChanged is called on user action, so we clear redo there.
    updateUndoButtons();
}

// Push a state to the redo stack
function pushRedoState(state) {
    redoStack.push(cloneState(state));
    if (redoStack.length > MAX_UNDO_STACK) {
        redoStack.shift();
    }
    updateUndoButtons();
}

// Pop from undo stack
function popUndoState() {
    if (undoStack.length === 0) return null;
    const state = undoStack.pop();
    updateUndoButtons();
    return state;
}

// Pop from redo stack
function popRedoState() {
    if (redoStack.length === 0) return null;
    const state = redoStack.pop();
    updateUndoButtons();
    return state;
}

function canUndo() {
    return undoStack.length > 0;
}

function canRedo() {
    return redoStack.length > 0;
}

// Update UI buttons
function updateUndoButtons() {
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");

    if (undoBtn) {
        undoBtn.disabled = !canUndo();
        undoBtn.style.opacity = canUndo() ? "1" : "0.5";
        undoBtn.style.cursor = canUndo() ? "pointer" : "default";
    }
    if (redoBtn) {
        redoBtn.disabled = !canRedo();
        redoBtn.style.opacity = canRedo() ? "1" : "0.5";
        redoBtn.style.cursor = canRedo() ? "pointer" : "default";
    }
}

// Snapshot helper: compares current state to lastSavedState.
function snapshotStateIfChanged() {
    const currentState = getConfigData(); // from model.js

    const currentStr = JSON.stringify(currentState);
    const lastStr = JSON.stringify(lastSavedState);

    if (currentStr !== lastStr) {
        // State has changed! Save the *old* state (lastSavedState) to undo stack
        pushUndoState(lastSavedState);

        // IMPORTANT: New user action clears the redo stack
        redoStack.length = 0;

        // Update lastSavedState to the new current state
        lastSavedState = cloneState(currentState);
        console.log("Undo snapshot taken. Undo stack:", undoStack.length, "Redo stack cleared.");
        updateUndoButtons();
    }
}

// Explicitly save the current state as the "last known good" state.
function resetLastSavedState() {
    lastSavedState = cloneState(getConfigData());
}
