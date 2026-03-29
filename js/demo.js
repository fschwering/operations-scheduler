// js/demo.js

function loadDemoData() {
  const demo = {
    titleText: "Operations Scheduler Demo",
    scheduleStart: "2026-04-01",
    scheduleEnd: "2026-06-30",
    projects: [
      { id: "P1", name: "High Priority", color: "#e41a1c" },
      { id: "P2", name: "Maintenance", color: "#377eb8" }
    ],
    groups: [
      { id: "G1", label: "Group Alpha", order: 1, color: "#4daf4a", height: 45, rowFontSize: 12, itemFontSize: 11, align: "center" },
      { id: "G2", label: "Group Beta", order: 2, color: "#984ea3", height: 45, rowFontSize: 12, itemFontSize: 11, align: "center" }
    ],
    items: [
      {
        itemName: "Op 101",
        label: "Operation 101",
        sub: "Initialization",
        groupId: "G1",
        projectId: "P1",
        startStr: "2026-04-05T08:00",
        durationDays: 10
      },
      {
        itemName: "Op 102",
        label: "Operation 102",
        sub: "Main Phase",
        groupId: "G1",
        projectId: "P1",
        dependsOnName: "Op 101",
        gapDays: 2,
        durationDays: 15
      },
      {
        itemName: "Maint A",
        label: "Maintenance A",
        sub: "System Check",
        groupId: "G2",
        projectId: "P2",
        startStr: "2026-04-10T10:00",
        durationDays: 5
      }
    ]
  };
  applyConfig(demo);
}