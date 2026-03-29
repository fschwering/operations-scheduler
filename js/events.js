// js/events.js

// --- Debounced chart rendering ---
let renderTimeout = null;
function scheduleRenderChart() {
  if (renderTimeout !== null) {
    clearTimeout(renderTimeout);
  }
  renderTimeout = setTimeout(() => {
    renderTimeout = null;
    // Snapshot state before re-rendering if it changed?
    // Actually, better to snapshot *before* the change happens.
    // But for inputs, we rely on the snapshotStateIfChanged() helper which compares against last saved.
    snapshotStateIfChanged();
    renderChart();
  }, 250);
}

// --- Undo Button ---
document.getElementById("undoBtn").addEventListener("click", () => {
  const state = popUndoState();
  if (state) {
    // Before applying undo, we must push current state to REDO stack.
    // But wait, popUndoState() already removed it from undo stack.
    // We need to save the *current* state (which is about to be lost) to the Redo stack.
    // Actually, the standard pattern is:
    // Undo: push current -> Redo, pop Undo -> apply
    // Redo: push current -> Undo, pop Redo -> apply

    // My undo.js logic for popUndoState just returns the state.
    // It doesn't handle the "push current to redo" part.
    // Let's do it here for clarity.

    pushRedoState(getConfigData()); // Save current state to redo
    applyConfig(state);
    renderChart();
    resetLastSavedState();
  }
});

document.getElementById("redoBtn").addEventListener("click", () => {
  const state = popRedoState();
  if (state) {
    pushUndoState(getConfigData()); // Save current state to undo
    applyConfig(state);
    renderChart();
    resetLastSavedState();
  }
});

// --- Top-level buttons ---

document.getElementById("addGroupBtn").addEventListener("click", () => {
  snapshotStateIfChanged(); // Save state before adding
  addGroupRow();
  refreshItemGroupSelects();
  refreshItemDependencySelects();
  scheduleRenderChart();
});

document.getElementById("addProjectBtn").addEventListener("click", () => {
  snapshotStateIfChanged();
  addProjectRow();
  refreshItemProjectSelects();
  scheduleRenderChart();
});

document.getElementById("addItemBtn").addEventListener("click", () => {
  snapshotStateIfChanged();
  addItemRow();
  refreshItemProjectSelects();
  refreshItemDependencySelects();
  scheduleRenderChart();
});

document.getElementById("resetDemoTopBtn").addEventListener("click", () => {
  if (!confirm("Are you sure you want to reset to demo data? This will overwrite your current entries.")) return;
  snapshotStateIfChanged();
  loadDemoData();
  renderChart(); // full immediate refresh
  resetLastSavedState();
});

// Manual update buttons
document.getElementById("updateChartTopBtn").addEventListener("click", renderChart);

// Save / Load
document.getElementById("saveTopBtn").addEventListener("click", () => handleSave());
document.getElementById("loadTopBtn").addEventListener("click", () => handleLoad());

// Export
document.getElementById("exportPngTopBtn").addEventListener("click", exportChartAsImage);
document.getElementById("exportCsvTopBtn").addEventListener("click", exportScheduleCsv);

// Hide / Show chart toggle
toggleChartBtn.addEventListener("click", () => {
  const collapsed = chartPanel.classList.toggle("collapsed");
  toggleChartBtn.textContent = collapsed ? "Show Chart" : "Hide Chart";
});

// --- Auto-render wiring for config inputs ---
// (all these are defined in dom-refs.js)

const configInputs = [
  titleInput, titleFontSizeInput, titleAlignSelect,
  leftHeaderInput, leftHeaderSizeInput,
  rightHeaderInput, rightHeaderSizeInput,
  scheduleStartInput, scheduleEndInput,
  labelUnitSelect, labelIntervalInput,
  showGridInput, gridUnitSelect, gridIntervalInput, gridThicknessInput, gridColorInput,
  showGrid2Input, gridUnit2Select, gridInterval2Input, gridThickness2Input, gridColor2Input,
  showTodayInput, todayColorInput, todayThicknessInput, todayOpacityInput,
  chartWidthInput,
  chartCommentInput, chartCommentSizeInput,
  liveDragInput
];

configInputs.forEach(el => {
  if (!el) return;
  const tag = el.tagName;
  const type = el.type;
  const evt = "change"; // Always use change (fires on blur for text inputs)
  el.addEventListener(evt, scheduleRenderChart);
});

// --- Group table actions ---

groupTable.tBodies[0].addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = btn.closest("tr");
  if (!tr) return;
  const tb = tr.parentElement;

  if (btn.classList.contains("group-delete")) {
    snapshotStateIfChanged();
    tb.removeChild(tr);
    refreshItemGroupSelects();
    refreshItemDependencySelects();
    scheduleRenderChart();
  } else if (btn.classList.contains("group-up")) {
    snapshotStateIfChanged();
    const prev = tr.previousElementSibling;
    if (prev) tb.insertBefore(tr, prev);
    scheduleRenderChart();
  } else if (btn.classList.contains("group-down")) {
    snapshotStateIfChanged();
    const next = tr.nextElementSibling;
    if (next) tb.insertBefore(tr, next.nextElementSibling);
    scheduleRenderChart();
    scheduleRenderChart();
  }
});

// When editing group cells, update item group dropdowns + chart
groupTable.tBodies[0].addEventListener("change", () => {
  refreshItemGroupSelects();
  refreshItemDependencySelects();
  scheduleRenderChart();
});

// --- Project table actions ---

projectTable.tBodies[0].addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = btn.closest("tr");
  if (!tr) return;
  const tb = tr.parentElement;

  if (btn.classList.contains("project-delete")) {
    snapshotStateIfChanged();
    tb.removeChild(tr);
    refreshItemProjectSelects();
    scheduleRenderChart();
  } else if (btn.classList.contains("project-up")) {
    snapshotStateIfChanged();
    const prev = tr.previousElementSibling;
    if (prev) tb.insertBefore(tr, prev);
    refreshItemProjectSelects();
    scheduleRenderChart();
  } else if (btn.classList.contains("project-down")) {
    snapshotStateIfChanged();
    const next = tr.nextElementSibling;
    if (next) tb.insertBefore(tr, next.nextElementSibling);
    refreshItemProjectSelects();
    scheduleRenderChart();
  }
});

// Project cell edits → refresh item project dropdowns + chart
projectTable.tBodies[0].addEventListener("change", () => {
  refreshItemProjectSelects();
  scheduleRenderChart();
});

// --- Item table actions ---

itemTable.tBodies[0].addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = btn.closest("tr");
  if (!tr) return;
  const tb = tr.parentElement;

  if (btn.classList.contains("item-delete")) {
    snapshotStateIfChanged();
    tb.removeChild(tr);
    refreshItemDependencySelects();
    scheduleRenderChart();
  } else if (btn.classList.contains("item-up")) {
    snapshotStateIfChanged();
    const prev = tr.previousElementSibling;
    if (prev) tb.insertBefore(tr, prev);
    refreshItemDependencySelects();
    scheduleRenderChart();
  } else if (btn.classList.contains("item-down")) {
    snapshotStateIfChanged();
    const next = tr.nextElementSibling;
    if (next) tb.insertBefore(tr, next.nextElementSibling);
    refreshItemDependencySelects();
    scheduleRenderChart();
  }
});

// Item edits (text, duration, gap, etc.)
// But NOT live-typing in datetime fields (handled on Enter/blur below)
itemTable.tBodies[0].addEventListener("change", e => {
  const target = e.target;
  if (
    target &&
    target.tagName === "INPUT" &&
    (target.type === "datetime-local" || target.type === "date" || target.type === "time")
  ) {
    // Don't auto-update chart while user is typing date/time
    return;
  }
  refreshItemDependencySelects();
  scheduleRenderChart();
});



// Commit date/time edits on Enter key
itemTable.tBodies[0].addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const target = e.target;
  if (
    target &&
    target.tagName === "INPUT" &&
    (target.type === "datetime-local" || target.type === "date" || target.type === "time")
  ) {
    e.preventDefault();
    commitItemDateChange(target, true);
  }
});

// Commit date/time edits on blur (leaving the field)
// Use capture so blur is caught at the tbody level
itemTable.tBodies[0].addEventListener("blur", e => {
  const target = e.target;
  if (
    target &&
    target.tagName === "INPUT" &&
    (target.type === "datetime-local" || target.type === "date" || target.type === "time")
  ) {
    commitItemDateChange(target, false);
  }
}, true);

// --- Manual date change behaviour for dependencies ---
// start-change: break dependency to parent
// end-change: keep dependency, update duration

function commitItemDateChange(inputEl, fromEnter) {
  const row = inputEl.closest("tr");
  if (!row) return;

  const td = inputEl.closest("td");
  if (!td) return;

  const cells = Array.from(td.parentElement.children);
  const colIndex = cells.indexOf(td) + 1; // 1-based index

  const startRow = row.querySelector("td:nth-child(6)");
  const endRow = row.querySelector("td:nth-child(7)");
  const depSelect = row.querySelector("td:nth-child(8) select");
  const gapInput = row.querySelector("td:nth-child(9) input");
  const durInput = row.querySelector("td:nth-child(10) input");

  const getFullDate = (td) => {
    const d = td.querySelector(".date-part");
    const t = td.querySelector(".time-part");
    if (d && d.value) {
      const timeStr = (t && t.value) ? t.value : "00:00";
      return parseDateTimeFromInput(d.value + "T" + timeStr);
    }
    return null;
  };

  const startDate = getFullDate(startRow);
  const endDate = getFullDate(endRow);

  // If this edit was on the Start column and there's a parent, break dependency
  if (colIndex === 6 && depSelect && depSelect.value) {
    depSelect.value = "";
    if (gapInput) gapInput.value = "";
  }

  // Recompute duration days when we have both dates
  if (startDate && endDate && durInput) {
    const durDays = (endDate.getTime() - startDate.getTime()) / MS_PER_DAY;
    if (!Number.isNaN(durDays) && durDays >= 0) {
      const rounded = Math.round(durDays * 10) / 10;
      durInput.value = String(rounded);
    }
  }

  // NOTE:
  // - If we edited Start, and there was a dependency, we've broken it now.
  // - If we edited End, we kept dependency and updated duration only.

  refreshItemDependencySelects();
  scheduleRenderChart();
}

// --- Initial load & resize ---

loadDemoData();
initUndo(getConfigData()); // Initialize undo baseline
renderChart();
window.addEventListener("resize", renderChart);