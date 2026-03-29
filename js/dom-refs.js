// js/dom-refs.js

// --- DOM handles ---
const scheduleStartInput = document.getElementById("scheduleStartInput");
const scheduleEndInput = document.getElementById("scheduleEndInput");
const titleInput = document.getElementById("titleInput");
const titleFontSizeInput = document.getElementById("titleFontSizeInput");
const titleAlignSelect = document.getElementById("titleAlignSelect");
const leftHeaderInput = document.getElementById("leftHeaderInput");
const leftHeaderSizeInput = document.getElementById("leftHeaderSizeInput");
const rightHeaderInput = document.getElementById("rightHeaderInput");
const rightHeaderSizeInput = document.getElementById("rightHeaderSizeInput");
const chartCommentInput = document.getElementById("chartCommentInput");
const chartCommentSizeInput = document.getElementById("chartCommentSizeInput");
const labelUnitSelect = document.getElementById("labelUnitSelect");
const labelIntervalInput = document.getElementById("labelIntervalInput");
const showGridInput = document.getElementById("showGridInput");
const gridUnitSelect = document.getElementById("gridUnitSelect");
const gridIntervalInput = document.getElementById("gridIntervalInput");
const gridThicknessInput = document.getElementById("gridThicknessInput");
const gridColorInput = document.getElementById("gridColorInput");
const showGrid2Input = document.getElementById("showGrid2Input");
const gridUnit2Select = document.getElementById("gridUnit2Select");
const gridInterval2Input = document.getElementById("gridInterval2Input");
const gridThickness2Input = document.getElementById("gridThickness2Input");
const gridColor2Input = document.getElementById("gridColor2Input");
const showTodayInput = document.getElementById("showTodayInput");
const todayColorInput = document.getElementById("todayColorInput");
const todayThicknessInput = document.getElementById("todayThicknessInput");
const todayOpacityInput = document.getElementById("todayOpacityInput");
const chartWidthInput = document.getElementById("chartWidthInput");
const liveDragInput = document.getElementById("liveDragInput");

const groupTable = document.getElementById("groupTable");
const projectTable = document.getElementById("projectTable");
const itemTable = document.getElementById("itemTable");
const loadConfigInput = document.getElementById("loadConfigInput");
const chartPanel = document.querySelector(".chart-panel");
const toggleChartBtn = document.getElementById("toggleChartBtn");

// Row / track containers
const rowLabelsEl = document.getElementById("rowLabels");
const rowTracksEl = document.getElementById("rowTracks");

// Timeline elements
const timelineLabelsEl = document.getElementById("timelineLabels");
const timelineTicksEl = document.getElementById("timelineTicks");

// Header text elements (for chart)
const chartTitleEl = document.getElementById("chartTitle");
const leftHeaderTextEl = document.getElementById("leftHeaderText");
const rightHeaderTextEl = document.getElementById("rightHeaderText");
const chartFooterCommentEl = document.getElementById("chartFooterComment");

// --- Auto-grow helper for textareas ---
function autoGrow(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = (textarea.scrollHeight + 2) + "px";
}

// --- Group / project / item helpers ---

function getGroupIdList() {
  const ids = [];
  groupTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const inp = tr.querySelector("td:nth-child(1) input");
    if (!inp) return;
    const id = inp.value.trim();
    if (id) ids.push(id);
  });
  return ids;
}

function addGroupRow(d = {}) {
  // Backwards compatible: if only d.fontSize exists, use it
  const rowFontSize = d.rowFontSize != null
    ? d.rowFontSize
    : (d.fontSize != null ? d.fontSize : 11);
  const itemFontSize = d.itemFontSize != null
    ? d.itemFontSize
    : rowFontSize;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input value="${d.id || ""}" /></td>
    <td><textarea class="auto-grow">${d.label || ""}</textarea></td>
    <td><input type="color" value="${d.color || "#31a357"}" /></td>
    <td><input type="color" value="${d.labelColor || "#000000"}" /></td>
    <td><input type="color" value="${d.itemTextColor || "#000000"}" /></td>
    <td><input type="number" value="${d.height != null ? d.height : 40}" /></td>
    <td><input type="number" value="${rowFontSize}" /></td>
    <td><input type="number" value="${itemFontSize}" /></td>
    <td>
      <select>
        <option value="left"${d.align === "left" || !d.align ? " selected" : ""}>Left</option>
        <option value="center"${d.align === "center" ? " selected" : ""}>Center</option>
        <option value="right"${d.align === "right" ? " selected" : ""}>Right</option>
      </select>
    </td>
    <td><input type="number" value="${d.order != null ? d.order : ""}" /></td>
    <td>
      <button class="group-up">↑</button>
      <button class="group-down">↓</button>
      <button class="group-delete">✕</button>
    </td>
  `;
  groupTable.tBodies[0].appendChild(tr);
  tr.querySelectorAll("textarea.auto-grow").forEach(autoGrow);
}

function addProjectRow(d = {}) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input value="${d.id || ""}" /></td>
    <td><textarea class="auto-grow">${d.name || ""}</textarea></td>
    <td><input type="color" value="${d.color || "#999999"}" /></td>
    <td><input type="number" value="${d.order != null ? d.order : ""}" /></td>
    <td>
      <button class="project-up">↑</button>
      <button class="project-down">↓</button>
      <button class="project-delete">✕</button>
    </td>
  `;
  projectTable.tBodies[0].appendChild(tr);
  tr.querySelectorAll("textarea.auto-grow").forEach(autoGrow);
}

function addItemRow(d = {}) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <select class="group-select"></select>
    </td>
    <td>
      <select class="project-select"></select>
    </td>
    <td>
      <textarea class="auto-grow">${d.itemName || ""}</textarea>
    </td>
    <td>
      <textarea class="auto-grow">${d.label || ""}</textarea>
    </td>
    <td>
      <textarea class="auto-grow">${d.sub || ""}</textarea>
    </td>
    <td>
      <div class="datetime-stack">
        <input type="date" class="date-part" value="${d.startStr ? d.startStr.split("T")[0] : (d.start ? d.start.split("T")[0] : "")}" />
        <input type="time" class="time-part" value="${d.startStr ? (d.startStr.split("T")[1] || "00:00") : (d.start ? (d.start.split("T")[1] || "00:00") : "")}" />
      </div>
    </td>
    <td>
      <div class="datetime-stack">
        <input type="date" class="date-part" value="${d.endStr ? d.endStr.split("T")[0] : (d.end ? d.end.split("T")[0] : "")}" />
        <input type="time" class="time-part" value="${d.endStr ? (d.endStr.split("T")[1] || "00:00") : (d.end ? (d.end.split("T")[1] || "00:00") : "")}" />
      </div>
    </td>
    <td>
      <select class="dep-select" data-initial="${d.dependsOnName || ""}"></select>
    </td>
    <td><input type="number" step="0.1" value="${d.gapDays != null && !Number.isNaN(d.gapDays) ? d.gapDays : ""}" /></td>
    <td><input type="number" step="0.1" value="${d.durationDays != null && !Number.isNaN(d.durationDays) ? d.durationDays : ""}" /></td>
    <td>
      <button class="item-up">↑</button>
      <button class="item-down">↓</button>
      <button class="item-delete">✕</button>
    </td>
  `;
  itemTable.tBodies[0].appendChild(tr);
  tr.querySelectorAll("textarea.auto-grow").forEach(autoGrow);

  // Populate dropdowns & apply initial selections (demo data or loaded config)
  refreshItemGroupSelects();
  refreshItemProjectSelects();
  refreshItemDependencySelects();

  const groupSel = tr.querySelector(".group-select");
  const projectSel = tr.querySelector(".project-select");
  if (groupSel && d.groupId) groupSel.value = d.groupId;
  if (projectSel && d.projectId) projectSel.value = d.projectId;
}

// Refresh dropdown options based on table content

function refreshItemGroupSelects() {
  const groupIds = getGroupIdList();
  itemTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const sel = tr.querySelector(".group-select");
    if (!sel) return;
    const cur = sel.value || "";
    let opts = '<option value=""></option>';
    groupIds.forEach(id => {
      opts += `<option value="${id}"${id === cur ? " selected" : ""}>${id}</option>`;
    });
    sel.innerHTML = opts;
    if (cur && groupIds.includes(cur)) sel.value = cur;
  });
}

function refreshItemProjectSelects() {
  const ids = [];
  projectTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const inp = tr.querySelector("td:nth-child(1) input");
    if (!inp) return;
    const id = inp.value.trim();
    if (id) ids.push(id);
  });
  itemTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const sel = tr.querySelector(".project-select");
    if (!sel) return;
    const cur = sel.value || "";
    let opts = '<option value=""></option>';
    ids.forEach(id => {
      opts += `<option value="${id}"${id === cur ? " selected" : ""}>${id}</option>`;
    });
    sel.innerHTML = opts;
    if (cur && ids.includes(cur)) sel.value = cur;
  });
}

function refreshItemDependencySelects() {
  const names = [];
  itemTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const nameInput =
      tr.querySelector("td:nth-child(3) textarea") ||
      tr.querySelector("td:nth-child(3) input");
    if (!nameInput) return;
    const nm = nameInput.value.trim();
    if (nm) names.push(nm);
  });

  itemTable.tBodies[0].querySelectorAll("tr").forEach(tr => {
    const sel = tr.querySelector(".dep-select");
    if (!sel) return;
    const cur = sel.value || sel.getAttribute("data-initial") || "";
    let opts = '<option value=""></option>';
    names.forEach(n => {
      opts += `<option value="${n}"${n === cur ? " selected" : ""}>${n}</option>`;
    });
    sel.innerHTML = opts;
    if (cur && names.includes(cur)) sel.value = cur;
    sel.removeAttribute("data-initial");
  });
}