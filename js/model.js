// js/model.js

// --- Read form data ---
function readFormData() {
  const sStr = scheduleStartInput.value;
  const eStr = scheduleEndInput.value;
  const s = sStr ? parseDateFromInput(sStr) : new Date();
  const e = eStr ? parseDateFromInput(eStr) : addDays(s, 60);

  // Optional fixed chart width (px)
  let chartWidthPx = null;
  if (chartWidthInput && chartWidthInput.value.trim() !== "") {
    const n = parseInt(chartWidthInput.value, 10);
    if (!isNaN(n) && n > 0) {
      chartWidthPx = n;
    }
  }

  const titleText = (titleInput.value || "").trim() || "Schedule Title";
  const titleSize = parseInt(titleFontSizeInput.value || "22", 10);
  const titleAlign = titleAlignSelect.value || "center";
  const leftHeaderText = (leftHeaderInput.value || "").trim() || "Subject to Change";
  const leftHeaderSize = parseInt(leftHeaderSizeInput.value || "11", 10);
  const rightHeaderText = (rightHeaderInput.value || "").trim() || "Updated:";
  const rightHeaderSize = parseInt(rightHeaderSizeInput.value || "11", 10);

  const labelUnit = labelUnitSelect.value;
  const labelInterval = Math.max(1, parseInt(labelIntervalInput.value || "1", 10));

  const showGrid = showGridInput.checked;
  const gridUnit = gridUnitSelect.value;
  const gridInterval = Math.max(1, parseInt(gridIntervalInput.value || "1", 10));
  const gridThickness = Math.max(1, parseInt(gridThicknessInput.value || "1", 10));
  const gridColor = gridColorInput.value || "#e0e0e0";

  const showGrid2 = showGrid2Input.checked;
  const gridUnit2 = gridUnit2Select.value;
  const gridInterval2 = Math.max(1, parseInt(gridInterval2Input.value || "1", 10));
  const gridThickness2 = Math.max(1, parseInt(gridThickness2Input.value || "1", 10));
  const gridColor2 = gridColor2Input.value || "#cccccc";

  const showToday = showTodayInput.checked;
  const todayColor = todayColorInput.value || "#00aa00";
  const todayThickness = Math.max(1, parseInt(todayThicknessInput.value || "2", 10));
  const todayOpacity = Math.min(1, Math.max(0, parseFloat(todayOpacityInput.value || "0.7")));

  const projects = [];
  const groups = [];
  const items = [];

  // Projects
  projectTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const idIn = tr.querySelector("td:nth-child(1) input");
    const nameIn = tr.querySelector("td:nth-child(2) input, td:nth-child(2) textarea");
    const colIn = tr.querySelector("td:nth-child(3) input[type=color]");
    if (!idIn) return;
    const id = idIn.value.trim();
    if (!id) return;
    projects.push({
      id,
      name: (nameIn && nameIn.value) || "",
      color: (colIn && colIn.value) || "#999999"
    });
  });

  // Groups  (columns: 1 ID, 2 Label, 3 Color, 4 Height, 5 Row FS, 6 Item FS, 7 Align, 8 Order)
  const groupRows = groupTable.tBodies[0].querySelectorAll("tr");

  groupRows.forEach((tr, i) => {
    const idIn = tr.querySelector("td:nth-child(1) input");
    const labEl = tr.querySelector("td:nth-child(2) textarea, td:nth-child(2) input");
    const colIn = tr.querySelector("td:nth-child(3) input[type=color]");
    const labelColIn = tr.querySelector("td:nth-child(4) input[type=color]");
    const itemTextColIn = tr.querySelector("td:nth-child(5) input[type=color]");
    const hIn = tr.querySelector("td:nth-child(6) input");
    const rowFontIn = tr.querySelector("td:nth-child(7) input");
    const itemFontIn = tr.querySelector("td:nth-child(8) input");
    const alignSel = tr.querySelector("td:nth-child(9) select");
    const ordIn = tr.querySelector("td:nth-child(10) input");

    if (!idIn) return;
    const id = idIn.value.trim();
    if (!id) return;

    let ord = parseInt(ordIn && ordIn.value, 10);
    if (isNaN(ord)) ord = i + 1;

    const rowFontSizeRaw = parseInt((rowFontIn && rowFontIn.value) || "11", 10);
    const itemFontSizeRaw = parseInt((itemFontIn && itemFontIn.value) || rowFontSizeRaw || 11, 10);
    const rowFontSize = isNaN(rowFontSizeRaw) ? 11 : rowFontSizeRaw;
    const itemFontSize = isNaN(itemFontSizeRaw) ? rowFontSize : itemFontSizeRaw;

    groups.push({
      id,
      label: (labEl && labEl.value) || "",
      order: ord,
      color: (colIn && colIn.value) || "#31a357",
      labelColor: (labelColIn && labelColIn.value) || "#000000",
      itemTextColor: (itemTextColIn && itemTextColIn.value) || "#000000",
      height: parseInt((hIn && hIn.value) || "40", 10),
      rowFontSize,
      itemFontSize,
      align: alignSel ? (alignSel.value || "left") : "left"
    });
  });

  // Items
  itemTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const gSel = tr.querySelector("td:nth-child(1) select");
    const projSel = tr.querySelector("td:nth-child(2) select.project-select");
    const nameEl = tr.querySelector("td:nth-child(3) textarea, td:nth-child(3) input");
    const labEl = tr.querySelector("td:nth-child(4) textarea, td:nth-child(4) input");
    const subEl = tr.querySelector("td:nth-child(5) textarea, td:nth-child(5) input");
    const stDate = tr.querySelector("td:nth-child(6) .date-part");
    const stTime = tr.querySelector("td:nth-child(6) .time-part");
    const enDate = tr.querySelector("td:nth-child(7) .date-part");
    const enTime = tr.querySelector("td:nth-child(7) .time-part");
    const depSel = tr.querySelector("td:nth-child(8) select");
    const gapIn = tr.querySelector("td:nth-child(9) input");
    const durIn = tr.querySelector("td:nth-child(10) input");
    if (!gSel) return;

    const gId = (gSel.value || "").trim();
    const rawName = nameEl ? nameEl.value.trim() : "";
    const lab = labEl ? labEl.value.trim() : "";
    const itemName = rawName || lab || "";
    if (!gId || !itemName) return;

    let st = "";
    if (stDate && stDate.value) {
      st = stDate.value + (stTime && stTime.value ? "T" + stTime.value : "T00:00");
    }
    let en = "";
    if (enDate && enDate.value) {
      en = enDate.value + (enTime && enTime.value ? "T" + enTime.value : "T00:00");
    }

    items.push({
      itemName,
      label: lab,   // no fallback to itemName for chart label
      sub: subEl ? subEl.value : "",
      groupId: gId,
      projectId: projSel ? projSel.value.trim() : "",
      startStr: st,
      endStr: en,
      dependsOnName: depSel ? depSel.value.trim() : "",
      gapDays: gapIn ? parseFloat(gapIn.value || "0") : 0,
      durationDays: durIn ? parseFloat(durIn.value || "") : NaN
    });
  });

  return {
    scheduleStart: stripTime(s),
    scheduleEnd: stripTime(e),
    projects,
    groups, items,
    titleText, titleSize, titleAlign,
    leftHeaderText, leftHeaderSize,
    rightHeaderText, rightHeaderSize,
    labelUnit, labelInterval,
    showGrid, gridUnit, gridInterval, gridThickness, gridColor,
    showGrid2, gridUnit2, gridInterval2, gridThickness2, gridColor2,
    showToday, todayColor, todayThickness, todayOpacity,
    chartWidthPx,
    chartComment: chartCommentInput.value || "",
    chartCommentSize: parseInt(chartCommentSizeInput.value || "12", 10)
  };
}

// --- Recalc dependencies & durations (with fractional days) ---
function recalcItemsAndUpdateForm(scheduleStart, items) {
  const rows = itemTable.tBodies[0].querySelectorAll("tr");
  const map = new Map();
  const calc = items.map(it => {
    const x = { ...it };
    x.startDate = it.startStr ? parseDateTimeFromInput(it.startStr) : null;
    x.endDate = it.endStr ? parseDateTimeFromInput(it.endStr) : null;
    map.set(it.itemName, x);
    return x;
  });

  for (let pass = 0; pass < 5; pass++) {
    calc.forEach(it => {
      if (it.dependsOnName) {
        const parent = map.get(it.dependsOnName);
        if (parent && parent.endDate) {
          const gap = isNaN(it.gapDays) ? 0 : it.gapDays;
          it.startDate = addDaysFloat(parent.endDate, gap);
        }
      }
      if (!isNaN(it.durationDays) && it.startDate) {
        const dur = Math.max(0, it.durationDays);
        it.endDate = addDaysFloat(it.startDate, dur);
      }
    });
  }

  calc.forEach((it, i) => {
    const tr = rows[i];
    if (!tr) return;
    const stDate = tr.querySelector("td:nth-child(6) .date-part");
    const stTime = tr.querySelector("td:nth-child(6) .time-part");
    const enDate = tr.querySelector("td:nth-child(7) .date-part");
    const enTime = tr.querySelector("td:nth-child(7) .time-part");

    if (it.startDate && stDate && stTime) {
      const v = toDateTimeInputValue(it.startDate);
      const [d, t] = v.split("T");
      stDate.value = d;
      stTime.value = t;
      it.startStr = v;
    }
    if (it.endDate && enDate && enTime) {
      const v = toDateTimeInputValue(it.endDate);
      const [d, t] = v.split("T");
      enDate.value = d;
      enTime.value = t;
      it.endStr = v;
    }
  });
  return calc;
}

// --- Save/load config ---
function getConfigData() {
  const cfg = readFormData();
  cfg.scheduleStartStr = scheduleStartInput.value || null;
  cfg.scheduleEndStr = scheduleEndInput.value || null;
  return cfg;
}

function exportConfig(filename) {
  const data = getConfigData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "schedule-config.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleSave(name = "schedule-config.json") {
  exportConfig(name);
}

function applyConfig(cfg) {
  try {
    if (cfg.titleText) titleInput.value = cfg.titleText;
    if (cfg.titleSize) titleFontSizeInput.value = cfg.titleSize;
    if (cfg.titleAlign) titleAlignSelect.value = cfg.titleAlign;
    if (cfg.leftHeaderText) leftHeaderInput.value = cfg.leftHeaderText;
    if (cfg.leftHeaderSize) leftHeaderSizeInput.value = cfg.leftHeaderSize;
    if (cfg.rightHeaderText) rightHeaderInput.value = cfg.rightHeaderText;
    if (cfg.rightHeaderSize) rightHeaderSizeInput.value = cfg.rightHeaderSize;

    if (cfg.chartComment !== undefined) chartCommentInput.value = cfg.chartComment;
    if (cfg.chartCommentSize) chartCommentSizeInput.value = cfg.chartCommentSize;

    const sRaw = cfg.scheduleStartStr || cfg.scheduleStart;
    const eRaw = cfg.scheduleEndStr || cfg.scheduleEnd;
    if (sRaw) {
      const d = typeof sRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sRaw)
        ? parseDateFromInput(sRaw)
        : new Date(sRaw);
      if (!isNaN(d)) scheduleStartInput.value = toDateInputValue(d);
    }
    if (eRaw) {
      const d = typeof eRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(eRaw)
        ? parseDateFromInput(eRaw)
        : new Date(eRaw);
      if (!isNaN(d)) scheduleEndInput.value = toDateInputValue(d);
    }

    // Restore chart width if present
    if (typeof cfg.chartWidthPx === "number" && chartWidthInput) {
      chartWidthInput.value = cfg.chartWidthPx;
    } else if (chartWidthInput && (cfg.chartWidthPx === null || cfg.chartWidthPx === undefined)) {
      chartWidthInput.value = "";
    }

    if (cfg.labelUnit) labelUnitSelect.value = cfg.labelUnit;
    if (typeof cfg.labelInterval === "number") labelIntervalInput.value = cfg.labelInterval;

    if (typeof cfg.showGrid === "boolean") showGridInput.checked = cfg.showGrid;
    if (cfg.gridUnit) gridUnitSelect.value = cfg.gridUnit;
    if (typeof cfg.gridInterval === "number") gridIntervalInput.value = cfg.gridInterval;
    if (typeof cfg.gridThickness === "number") gridThicknessInput.value = cfg.gridThickness;
    if (cfg.gridColor) gridColorInput.value = cfg.gridColor;

    if (typeof cfg.showGrid2 === "boolean") showGrid2Input.checked = cfg.showGrid2;
    if (cfg.gridUnit2) gridUnit2Select.value = cfg.gridUnit2;
    if (typeof cfg.gridInterval2 === "number") gridInterval2Input.value = cfg.gridInterval2;
    if (typeof cfg.gridThickness2 === "number") gridThickness2Input.value = cfg.gridThickness2;
    if (cfg.gridColor2) gridColor2Input.value = cfg.gridColor2;

    if (typeof cfg.showToday === "boolean") showTodayInput.checked = cfg.showToday;
    if (cfg.todayColor) todayColorInput.value = cfg.todayColor;
    if (typeof cfg.todayThickness === "number") todayThicknessInput.value = cfg.todayThickness;
    if (typeof cfg.todayOpacity === "number") todayOpacityInput.value = cfg.todayOpacity;

    // Projects
    projectTable.tBodies[0].innerHTML = "";
    (cfg.projects || []).forEach(addProjectRow);

    // Groups
    groupTable.tBodies[0].innerHTML = "";
    (cfg.groups || []).forEach(addGroupRow);

    // Items
    itemTable.tBodies[0].innerHTML = "";
    (cfg.items || []).forEach(it => addItemRow({
      itemName: it.itemName,
      label: it.label,
      sub: it.sub,
      groupId: it.groupId,
      projectId: it.projectId,
      startStr: it.startStr || it.start,
      endStr: it.endStr || it.end,
      dependsOnName: it.dependsOnName,
      gapDays: it.gapDays,
      durationDays: it.durationDays
    }));

    refreshItemGroupSelects();
    refreshItemProjectSelects();
    refreshItemDependencySelects();
    document.querySelectorAll("textarea.auto-grow").forEach(autoGrow);
  } catch (e) {
    alert("Failed to apply config: " + e.message);
  }
}

function handleLoad() {
  loadConfigInput.value = "";
  loadConfigInput.click();
}

loadConfigInput.addEventListener("change", e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const cfg = JSON.parse(r.result);
      applyConfig(cfg);
      renderChart();
    } catch (err) {
      alert("Could not read config file: " + err.message);
    }
  };
  r.readAsText(f);
});
