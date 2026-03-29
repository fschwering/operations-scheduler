// js/chart.js

// Shared context for drag / resize interactions
let ganttChartContext = {
  scheduleStart: null,
  scheduleEnd: null,
  totalDays: 0,
  chartWidthPx: 0,
  pixelsPerDay: 0
};

// Current drag state (if any)
let ganttDragState = null;

// Whether live drag editing is enabled (controlled by checkbox)
let liveDragEnabledFlag = true;

function renderChart() {
  const cfg = readFormData();
  let {
    scheduleStart, scheduleEnd,
    projects,
    groups, items,
    titleText, titleSize, titleAlign,
    leftHeaderText, leftHeaderSize,
    rightHeaderText, rightHeaderSize,
    chartComment, chartCommentSize,
    labelUnit, labelInterval,
    showGrid, gridUnit, gridInterval, gridThickness, gridColor,
    showGrid2, gridUnit2, gridInterval2, gridThickness2, gridColor2,
    showToday, todayColor, todayThickness, todayOpacity,
    chartWidthPx
  } = cfg;

  const rowsEl = rowTracksEl;
  const labelsEl = timelineLabelsEl;
  const ticksEl = timelineTicksEl;
  const rlabelsEl = rowLabelsEl;

  if (!rowsEl || !labelsEl || !ticksEl || !rlabelsEl) return;

  // Live drag toggle from checkbox
  const liveDragCheckbox = document.getElementById("liveDragInput");
  liveDragEnabledFlag = !!(liveDragCheckbox && liveDragCheckbox.checked);

  // Header text
  const titleEl = document.getElementById("chartTitle");
  titleEl.textContent = titleText;
  titleEl.style.fontSize = (titleSize || 22) + "px";
  titleEl.style.textAlign = titleAlign || "center";

  const leftHeaderEl = document.getElementById("leftHeaderText");
  leftHeaderEl.textContent = leftHeaderText;
  leftHeaderEl.style.fontSize = (leftHeaderSize || 11) + "px";

  const rightHeaderEl = document.getElementById("rightHeaderText");
  rightHeaderEl.textContent = rightHeaderText;
  rightHeaderEl.style.fontSize = (rightHeaderSize || 11) + "px";

  /* Legend Logic */
  const legendEl = document.getElementById("groupingLegend");
  if (legendEl) {
    legendEl.innerHTML = "";
    if (projects && projects.length > 0) {
      projects.forEach(p => {
        const item = document.createElement("div");
        item.className = "legend-item";

        const colorBox = document.createElement("div");
        colorBox.className = "legend-color";
        colorBox.style.background = p.color || "#999";

        const label = document.createElement("span");
        label.textContent = p.name || p.id;

        item.appendChild(colorBox);
        item.appendChild(label);
        legendEl.appendChild(item);
      });
    }
  }

  /* Chart Comment Logic */
  const footerEl = document.getElementById("chartFooterComment");
  if (footerEl) {
    footerEl.textContent = chartComment || "";
    footerEl.style.fontSize = (chartCommentSize || 12) + "px";

    // We want to align this with the timeline part (skip the 90px + 8px spacer)
    // The spacer logic is identical to .axis-spacer width + margin
    // We can just rely on the CSS margin-left since the spacer is fixed width
    // But let's check if we want to be dynamic. 
    // The .axis-spacer width is 90px, margin-right 8px. Total 98px.
    footerEl.style.marginLeft = "98px";
  }

  // Time helpers
  const dayIndex = d => (d.getTime() - scheduleStart.getTime()) / MS_PER_DAY;
  const totalDays = Math.max(1e-6, dayIndex(scheduleEnd));

  // Sort groups by order
  const sortedGroups = [...groups].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Recalc items including dependency passes, returns enriched items with startStr/endStr
  const itemsCalc = recalcItemsAndUpdateForm(scheduleStart, items);

  // Clear old timeline elements
  labelsEl.innerHTML = "";
  ticksEl.innerHTML = "";
  rowsEl.innerHTML = "";
  rlabelsEl.innerHTML = "";

  // Apply overall Gantt wrapper width (outer white box)
  const wrapperEl = document.querySelector(".schedule-wrapper");
  if (wrapperEl) {
    if (chartWidthPx && chartWidthPx > 0) {
      wrapperEl.style.width = chartWidthPx + "px";
    } else {
      wrapperEl.style.width = "";
    }
  }

  // Compute full width in px for timeline (inner axis) area.
  // We want the chart to "squeeze" into the available space to avoid horizontal scrolling,
  // even if a manual width is set (treating it as a max preferred width).

  // 1. Calculate available width in the container (excluding scrollbar)
  // We want the chart to "squeeze" into the available space to avoid horizontal scrolling,
  // even if a manual width is set (treating it as a max preferred width).

  const axisMainEl = document.querySelector(".axis-main");
  const axisSpacerEl = document.querySelector(".axis-spacer");

  const totalPadding = 88; // 32+32+4+20
  const spacerMargin = 8;
  const spacerWidth = axisSpacerEl ? axisSpacerEl.getBoundingClientRect().width : 90;

  let axisWidthPx;

  // If manual width is set, use it.
  if (chartWidthPx && chartWidthPx > 0) {
    // If user sets a total width, we must subtract the spacer (row labels) so the timeline fits inside.
    // Also subtract a buffer (e.g. 40px) for the rightmost label which is centered on the end tick.
    const rightLabelBuffer = 40;
    axisWidthPx = chartWidthPx - spacerWidth - spacerMargin - rightLabelBuffer;
  } else {
    axisWidthPx = document.body.clientWidth - totalPadding - spacerWidth - spacerMargin;
  }



  if (!Number.isFinite(axisWidthPx) || axisWidthPx < 100) {
    axisWidthPx = 100;
  }

  // Force axis-main to that width so flexbox + math stay in sync
  if (axisMainEl) {
    axisMainEl.style.width = axisWidthPx + "px";
  }

  // Also force the .rows container to match the total width so it aligns with timeline
  // (axisWidthPx + spacer)
  if (rowsEl && rowsEl.parentElement) {
    // spacer is usually 90px
    const spacerW = axisSpacerEl ? axisSpacerEl.getBoundingClientRect().width : 90;
    rowsEl.parentElement.style.width = (axisWidthPx + spacerW + spacerMargin) + "px";
  }



  const posX = frac => frac * axisWidthPx;

  // Timeline label containers
  labelsEl.style.width = axisWidthPx + "px";
  ticksEl.style.width = axisWidthPx + "px";

  function addTimeUnit(date, unit, n) {
    const d = new Date(date.getTime());
    if (unit === "days") d.setDate(d.getDate() + n);
    else if (unit === "weeks") d.setDate(d.getDate() + n * 7);
    else if (unit === "months") d.setMonth(d.getMonth() + n);
    else if (unit === "years") d.setFullYear(d.getFullYear() + n);
    return d;
  }

  // Build tick dates and fractions
  const tickDates = [];
  const tickFracs = [];
  if (labelInterval > 0) {
    let cur = new Date(
      scheduleStart.getFullYear(),
      scheduleStart.getMonth(),
      scheduleStart.getDate()
    );

    // Snap to start of month/year if needed so labels align with the 1st
    if (labelUnit === "months") {
      cur.setDate(1);
    } else if (labelUnit === "years") {
      cur.setMonth(0);
      cur.setDate(1);
    }
    let loops = 0;
    while (cur <= scheduleEnd && loops < 5000) {
      const frac = dayIndex(cur) / totalDays;
      tickDates.push(cur);
      tickFracs.push(frac);
      cur = addTimeUnit(cur, labelUnit, labelInterval);
      loops++;
    }
  }

  // Prepare items for drawing
  const itemsForDraw = itemsCalc.map(it => {
    const x = { ...it };
    x.startDate = it.startStr ? parseDateTimeFromInput(it.startStr) : null;
    x.endDate = it.endStr ? parseDateTimeFromInput(it.endStr) : null;
    return x;
  }).sort((a, b) => {
    // Sort by start date to ensure later tasks layer on top of earlier ones
    // so that overflow text is covered by the next task.
    const tA = a.startDate ? a.startDate.getTime() : 0;
    const tB = b.startDate ? b.startDate.getTime() : 0;
    return tA - tB;
  });

  // Build grid lines as fractions of totalDays
  const gridLines = [];
  if (showGrid) {
    let g = new Date(
      scheduleStart.getFullYear(),
      scheduleStart.getMonth(),
      scheduleStart.getDate()
    );
    let count = 0;
    while (g <= scheduleEnd && count < 1000) {
      const frac = dayIndex(g) / totalDays;
      gridLines.push({ frac, thickness: gridThickness, color: gridColor });
      g = addTimeUnit(g, gridUnit, gridInterval);
      count++;
    }
  }
  if (showGrid2) {
    let g2 = new Date(
      scheduleStart.getFullYear(),
      scheduleStart.getMonth(),
      scheduleStart.getDate()
    );
    let count2 = 0;
    while (g2 <= scheduleEnd && count2 < 1000) {
      const frac = dayIndex(g2) / totalDays;
      gridLines.push({ frac, thickness: gridThickness2, color: gridColor2 });
      g2 = addTimeUnit(g2, gridUnit2, gridInterval2);
      count2++;
    }
  }

  // Render group rows (labels + tracks)
  sortedGroups.forEach((g, idx) => {
    const labDiv = document.createElement("div");
    labDiv.className = "row-label";
    labDiv.style.background = g.color || "#31a357";
    labDiv.style.color = g.labelColor || "#000000";
    labDiv.style.fontSize = (g.rowFontSize || 11) + "px";
    labDiv.style.minHeight = (g.height || 40) + "px";
    labDiv.style.lineHeight = "1.2";
    labDiv.textContent = g.label || g.id || "";

    const trackDiv = document.createElement("div");
    trackDiv.className = "row-track";
    trackDiv.style.minHeight = (g.height || 40) + "px";

    rlabelsEl.appendChild(labDiv);
    rowsEl.appendChild(trackDiv);
  });

  // Map of project id -> color
  const projectColors = new Map();
  projects.forEach(p => {
    if (p.id && p.color) {
      projectColors.set(p.id, p.color);
    }
  });

  // Render timeline labels & ticks
  tickDates.forEach((d, i) => {
    const frac = tickFracs[i];
    const x = posX(frac);

    const span = document.createElement("span");
    // Use shared formatLabel from utils.js (no local override)
    span.textContent = formatLabel(d, labelUnit);
    span.style.left = x + "px";
    labelsEl.appendChild(span);
  });

  tickFracs.forEach(frac => {
    const x = posX(frac);
    const tick = document.createElement("div");
    tick.className = "timeline-tick";
    tick.style.left = x + "px";
    ticksEl.appendChild(tick);
  });

  // Fill rows with grid lines + tasks
  const tracks = rowsEl.querySelectorAll(".row-track");
  sortedGroups.forEach((g, idx) => {
    const track = tracks[idx];
    if (!track) return;

    // Grid lines
    gridLines.forEach(gl => {
      const glEl = document.createElement("div");
      glEl.className = "grid-line";
      glEl.style.left = posX(gl.frac) + "px";
      glEl.style.width = gl.thickness + "px";
      glEl.style.background = gl.color;
      track.appendChild(glEl);
    });

    // Tasks for this group
    const tasks = itemsForDraw.filter(it => it.groupId === g.id);
    tasks.forEach(t => {
      if (!t.startDate || !t.endDate) return;
      const si = dayIndex(t.startDate);
      const ei = dayIndex(t.endDate);
      const startFrac = si / totalDays;
      const endFrac = ei / totalDays;
      const leftPx = posX(startFrac);
      const widthPx = Math.max(1, posX(endFrac) - posX(startFrac));

      const el = document.createElement("div");
      el.className = "task";
      el.style.left = leftPx + "px";
      el.style.width = widthPx + "px";
      el.style.height = Math.max(20, (g.height || 40) - 12) + "px";

      // Attach identifying data for drag / resize
      if (t.itemName) {
        el.dataset.itemName = t.itemName;
      }

      // Only show handles & drag when live drag is enabled
      if (liveDragEnabledFlag) {
        const handleLeft = document.createElement("div");
        handleLeft.className = "task-handle task-handle-left";
        const handleRight = document.createElement("div");
        handleRight.className = "task-handle task-handle-right";
        el.appendChild(handleLeft);
        el.appendChild(handleRight);
      } else {
        // No handles, and no move cursor when drag is disabled
        el.style.cursor = "default";
      }

      // Color: project override > group color
      let barColor = g.color || "#31a357";
      if (t.projectId && projectColors.has(t.projectId)) {
        barColor = projectColors.get(t.projectId);
      }
      el.style.background = barColor;
      el.style.color = g.itemTextColor || "#000000";
      el.style.fontSize = (g.itemFontSize || g.fontSize || 11) + "px";

      // Align text based on group alignment
      const align = g.align || "left";
      if (align === "center") {
        el.style.textAlign = "center";
      } else if (align === "right") {
        el.style.textAlign = "right";
      } else {
        el.style.textAlign = "left";
      }

      // Label & sub-label honoring line breaks
      // Enclosed in a wrapper to handle overflow/cutoff
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "task-content-wrapper";

      const titleEl = document.createElement("strong");
      titleEl.textContent = t.label || "";
      // Styles are handled by wrapper, but we keep structure
      contentWrapper.appendChild(titleEl);

      if (t.sub) {
        const subEl = document.createElement("span");
        subEl.className = "sub";
        subEl.textContent = t.sub;
        contentWrapper.appendChild(subEl);
      }

      el.appendChild(contentWrapper);

      // Enable drag / resize interactions for this task
      registerTaskDragHandlers(el);

      track.appendChild(el);
    });
  });

  // Today line
  document.querySelectorAll(".today-line").forEach(el => el.remove());
  if (showToday) {
    const now = new Date();
    const today = stripTime(now);
    if (today >= scheduleStart && today <= scheduleEnd) {
      const frac = dayIndex(today) / totalDays;
      const leftPx = posX(frac);
      const todayColorRgba = hexToRgba(todayColor, todayOpacity);

      rowsEl.querySelectorAll(".row-track").forEach(track => {
        const line = document.createElement("div");
        line.className = "today-line";
        line.style.left = leftPx + "px";
        line.style.background = todayColorRgba;
        line.style.width = todayThickness + "px";
        track.appendChild(line);
      });
    }
  }

  // Update drag context for this render
  ganttChartContext.scheduleStart = scheduleStart;
  ganttChartContext.scheduleEnd = scheduleEnd;
  ganttChartContext.totalDays = totalDays;
  ganttChartContext.chartWidthPx = axisWidthPx;
  ganttChartContext.pixelsPerDay = totalDays > 0 ? (axisWidthPx / totalDays) : 0;
}

// --- Drag / resize support for Gantt tasks ---

function registerTaskDragHandlers(taskEl) {
  // Always remove old listener first
  taskEl.removeEventListener("mousedown", onTaskMouseDown);
  if (!liveDragEnabledFlag) {
    return; // drag is globally disabled
  }
  taskEl.addEventListener("mousedown", onTaskMouseDown);
}

function onTaskMouseDown(e) {
  if (e.button !== 0) return; // left click only

  const taskEl = e.currentTarget;
  const target = e.target;

  let mode = "move";
  if (target.classList && target.classList.contains("task-handle-left")) {
    mode = "resize-left";
  } else if (target.classList && target.classList.contains("task-handle-right")) {
    mode = "resize-right";
  }

  const itemName = taskEl.dataset.itemName;
  if (!itemName) return;

  if (!ganttChartContext || !ganttChartContext.pixelsPerDay) return;

  // Find matching row in item table
  const rows = itemTable.tBodies[0].querySelectorAll("tr");
  let row = null;
  for (const tr of rows) {
    const nameInput =
      tr.querySelector("td:nth-child(3) textarea") ||
      tr.querySelector("td:nth-child(3) input");
    if (nameInput && nameInput.value.trim() === itemName) {
      row = tr;
      break;
    }
  }
  if (!row) return;

  const startInput = row.querySelector("td:nth-child(6) input");
  const endInput = row.querySelector("td:nth-child(7) input");

  const originalStartDate = startInput ? parseDateTimeFromInput(startInput.value) : null;
  const originalEndDate = endInput ? parseDateTimeFromInput(endInput.value) : null;

  if (!originalStartDate || !originalEndDate) {
    return; // cannot drag without valid dates
  }

  const trackEl = taskEl.parentElement;
  const trackRect = trackEl.getBoundingClientRect();
  const taskRect = taskEl.getBoundingClientRect();
  const originalLeftPx = taskRect.left - trackRect.left;
  const originalWidthPx = taskRect.width;

  ganttDragState = {
    mode,
    taskEl,
    row,
    itemName,
    originalStartDate,
    originalEndDate,
    previewStartDate: originalStartDate,
    previewEndDate: originalEndDate,
    startMouseX: e.clientX,
    originalLeftPx,
    originalWidthPx
  };

  document.addEventListener("mousemove", onTaskMouseMove);
  document.addEventListener("mouseup", onTaskMouseUp);
  document.body.classList.add("gantt-dragging");

  e.preventDefault();
}

function onTaskMouseMove(e) {
  if (!ganttDragState || !ganttChartContext || !ganttChartContext.pixelsPerDay) return;

  const state = ganttDragState;
  const ctx = ganttChartContext;
  const deltaX = e.clientX - state.startMouseX;

  let newLeftPx = state.originalLeftPx;
  let newWidthPx = state.originalWidthPx;
  let newStart = state.originalStartDate;
  let newEnd = state.originalEndDate;

  const minWidthPx = 6;

  if (state.mode === "move") {
    newLeftPx = state.originalLeftPx + deltaX;
    // clamp: keep entire bar in chart
    newLeftPx = Math.min(
      Math.max(0, newLeftPx),
      Math.max(0, ctx.chartWidthPx - state.originalWidthPx)
    );
    const deltaInDays = (newLeftPx - state.originalLeftPx) / ctx.pixelsPerDay;
    newStart = new Date(state.originalStartDate.getTime() + deltaInDays * MS_PER_DAY);
    newEnd = new Date(state.originalEndDate.getTime() + deltaInDays * MS_PER_DAY);
    newWidthPx = state.originalWidthPx;
  } else if (state.mode === "resize-left") {
    newLeftPx = state.originalLeftPx + deltaX;
    const maxLeftForMinWidth = state.originalLeftPx + state.originalWidthPx - minWidthPx;
    newLeftPx = Math.min(Math.max(0, newLeftPx), maxLeftForMinWidth);
    newWidthPx = state.originalWidthPx - (newLeftPx - state.originalLeftPx);
    const deltaInDays = (newLeftPx - state.originalLeftPx) / ctx.pixelsPerDay;
    newStart = new Date(state.originalStartDate.getTime() + deltaInDays * MS_PER_DAY);
    newEnd = state.originalEndDate;
  } else if (state.mode === "resize-right") {
    newWidthPx = state.originalWidthPx + deltaX;
    const maxWidth = ctx.chartWidthPx - state.originalLeftPx;
    newWidthPx = Math.min(
      Math.max(minWidthPx, newWidthPx),
      Math.max(minWidthPx, maxWidth)
    );
    const deltaInDays = (newWidthPx - state.originalWidthPx) / ctx.pixelsPerDay;
    newEnd = new Date(state.originalEndDate.getTime() + deltaInDays * MS_PER_DAY);
    newStart = state.originalStartDate;
  }

  state.previewStartDate = newStart;
  state.previewEndDate = newEnd;

  state.taskEl.style.left = newLeftPx + "px";
  state.taskEl.style.width = newWidthPx + "px";
}

function onTaskMouseUp() {
  if (!ganttDragState) return;

  document.removeEventListener("mousemove", onTaskMouseMove);
  document.removeEventListener("mouseup", onTaskMouseUp);
  document.body.classList.remove("gantt-dragging");

  const state = ganttDragState;
  ganttDragState = null;

  const row = state.row;
  if (!row || !state.previewStartDate || !state.previewEndDate) return;

  const startInput = row.querySelector("td:nth-child(6) input");
  const endInput = row.querySelector("td:nth-child(7) input");
  const depSelect = row.querySelector("td:nth-child(8) select");
  const gapInput = row.querySelector("td:nth-child(9) input");
  const durInput = row.querySelector("td:nth-child(10) input");

  let newStart = state.previewStartDate;
  let newEnd = state.previewEndDate;

  if (state.mode === "resize-left") {
    newStart = state.previewStartDate;
    newEnd = state.originalEndDate;
  } else if (state.mode === "resize-right") {
    newStart = state.originalStartDate;
    newEnd = state.previewEndDate;
  }

  if (startInput && newStart) {
    startInput.value = toDateTimeInputValue(newStart);
  }
  if (endInput && newEnd) {
    endInput.value = toDateTimeInputValue(newEnd);
  }

  // Update duration (days) from new dates
  if (durInput && newStart && newEnd) {
    const durDays = (newEnd.getTime() - newStart.getTime()) / MS_PER_DAY;
    if (!Number.isNaN(durDays) && durDays >= 0) {
      const rounded = Math.round(durDays * 10) / 10;
      durInput.value = String(rounded);
    }
  }

  // If this item depends on another, adjust its gapDays to keep the link
  if (depSelect && depSelect.value && gapInput && newStart) {
    const parentName = depSelect.value;
    const parentRow = findItemRowByName(parentName);
    if (parentRow) {
      const parentEndInput = parentRow.querySelector("td:nth-child(7) input");
      const parentEndDate =
        parentEndInput ? parseDateTimeFromInput(parentEndInput.value) : null;
      if (parentEndDate) {
        const gapFloat =
          (newStart.getTime() - parentEndDate.getTime()) / MS_PER_DAY;
        if (!Number.isNaN(gapFloat)) {
          const roundedGap = Math.round(gapFloat * 10) / 10;
          gapInput.value = String(roundedGap);
        }
      }
    }
  }

  // Re-render to re-apply dependency logic (children follow parents, etc.)
  snapshotStateIfChanged();
  renderChart();
}

function findItemRowByName(name) {
  if (!name) return null;
  const rows = itemTable.tBodies[0].querySelectorAll("tr");
  for (const tr of rows) {
    const nameInput =
      tr.querySelector("td:nth-child(3) textarea") ||
      tr.querySelector("td:nth-child(3) input");
    if (nameInput && nameInput.value.trim() === name) {
      return tr;
    }
  }
  return null;
}