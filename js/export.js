// js/export.js

// --- Export chart / PNG ---
function exportChartAsImage() {
  const el = document.querySelector(".schedule-wrapper");
  if (!el || typeof html2canvas === "undefined") {
    alert("Export to image is not available in this environment.");
    return;
  }

  html2canvas(el, {
    scale: 2, // Higher quality
    onclone: (clonedDoc) => {
      // Find the wrapper in the cloned document
      const clonedWrapper = clonedDoc.querySelector(".schedule-wrapper");
      const clonedPanel = clonedDoc.querySelector(".chart-panel");

      // Force full height/width visibility so we capture everything
      if (clonedWrapper) {
        clonedWrapper.style.overflow = "visible";
        clonedWrapper.style.height = "auto";
        clonedWrapper.style.maxHeight = "none";
      }
      if (clonedPanel) {
        clonedPanel.style.overflow = "visible";
        clonedPanel.style.height = "auto";
        clonedPanel.style.maxHeight = "none";
      }
    }
  }).then(canvas => {
    if (canvas.toBlob) {
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schedule-chart.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } else {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "schedule-chart.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });
}

// --- Export schedule data to CSV ---
function exportScheduleCsv() {
  // Helper: Excel-friendly local datetime: YYYY-MM-DD HH:MM
  function formatExcelDateTime(d) {
    if (!d) return "";
    const pad = n => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    return year + "-" + month + "-" + day + " " + hour + ":" + minute;
  }

  // Use current form state
  const cfg = readFormData();

  const groupsById = new Map((cfg.groups || []).map(g => [g.id, g]));
  const projectsById = new Map((cfg.projects || []).map(p => [p.id, p]));

  // Recalculate items so dependencies + durations are reflected
  const calcItems = recalcItemsAndUpdateForm(cfg.scheduleStart, cfg.items || []);

  const rows = calcItems.map(it => {
    const g = groupsById.get(it.groupId) || {};
    const p = it.projectId ? (projectsById.get(it.projectId) || {}) : {};

    return {
      project_id: it.projectId || "",
      project_name: p.name || "",
      group_id: it.groupId || "",
      group_label: g.label || "",
      item_name: it.itemName || "",
      item_label: it.label || "",
      sub_label: it.sub || "",
      // Excel-friendly: local datetime, not ISO
      start: it.startDate ? formatExcelDateTime(it.startDate) : (it.startStr || ""),
      end: it.endDate ? formatExcelDateTime(it.endDate) : (it.endStr || ""),
      depends_on: it.dependsOnName || "",
      gap_days: (it.gapDays ?? "") === "" ? "" : it.gapDays,
      duration_days: (it.durationDays ?? "") === "" ? "" : it.durationDays,
      group_color: g.color || "",
      project_color: p.color || "",
      group_order: g.order != null ? g.order : "",
      group_height: g.height != null ? g.height : "",
      row_font_size: g.rowFontSize != null ? g.rowFontSize : "",
      item_font_size: g.itemFontSize != null ? g.itemFontSize : ""
    };
  });

  const defaultShape = {
    project_id: "",
    project_name: "",
    group_id: "",
    group_label: "",
    item_name: "",
    item_label: "",
    sub_label: "",
    start: "",
    end: "",
    depends_on: "",
    gap_days: "",
    duration_days: "",
    group_color: "",
    project_color: "",
    group_order: "",
    group_height: "",
    row_font_size: "",
    item_font_size: ""
  };

  if (!rows.length) {
    rows.push(defaultShape);
  }

  const headers = Object.keys(rows[0] || defaultShape);

  const esc = v => {
    if (v == null) v = "";
    v = String(v);
    if (v.includes('"') || v.includes(",") || v.includes("\n")) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  };

  const lines = [];
  lines.push(headers.join(","));
  rows.forEach(r => {
    const line = headers.map(h => esc(r[h])).join(",");
    lines.push(line);
  });

  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "schedule-data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
