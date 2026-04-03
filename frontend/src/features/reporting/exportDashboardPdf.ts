import type {
  ActivityDailyRecord,
  DashboardFilters,
  GoalsRecord,
  StreaksResponse,
  Workout,
} from "@/src/types/fitness";

interface ExportPayload {
  filters: DashboardFilters;
  workouts: Workout[];
  chartData: { name: string; value: number }[];
  activity: ActivityDailyRecord[];
  goal: GoalsRecord | null;
  streaks: StreaksResponse | null;
}

export const exportDashboardPdf = async ({
  filters,
  workouts,
  chartData,
  activity,
  goal,
  streaks,
}: ExportPayload) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const topMargin = 34;
  const bottomMargin = 34;
  const contentWidth = pageWidth - marginX * 2;
  const colors = {
    navy: [10, 20, 43] as const,
    textDark: [15, 23, 42] as const,
    textMuted: [71, 85, 105] as const,
    border: [203, 213, 225] as const,
    bgSoft: [241, 245, 249] as const,
  };

  let y = topMargin;

  const drawHeaderBand = () => {
    doc.setFillColor(...colors.navy);
    doc.roundedRect(marginX, y, contentWidth, 90, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FitSheet Activity Report", marginX + 18, y + 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(186, 230, 253);
    doc.text(`Generated on ${new Date().toLocaleString()}`, marginX + 18, y + 54);
    doc.text("Workout + activity + goals snapshot", marginX + 18, y + 70);
    y += 106;
  };

  const drawCard = (
    x: number,
    cardY: number,
    width: number,
    height: number,
    title: string,
    value: string
  ) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(x, cardY, width, height, 8, 8, "FD");
    doc.setTextColor(...colors.textMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title.toUpperCase(), x + 10, cardY + 16);
    doc.setTextColor(...colors.textDark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const wrappedValue = doc.splitTextToSize(value, width - 20) as string[];
    doc.text(wrappedValue, x + 10, cardY + 33);
  };

  drawHeaderBand();

  doc.setTextColor(...colors.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Applied Filters", marginX, y);
  y += 10;

  const filterCardHeight = 52;
  const filterGap = 10;
  const filterWidth = (contentWidth - filterGap) / 2;
  drawCard(marginX, y, filterWidth, filterCardHeight, "User", filters.user === "all" ? "All users" : filters.user);
  drawCard(
    marginX + filterWidth + filterGap,
    y,
    filterWidth,
    filterCardHeight,
    "Muscle Group",
    filters.muscleGroup === "all" ? "All groups" : filters.muscleGroup
  );
  y += filterCardHeight + 8;
  drawCard(marginX, y, filterWidth, filterCardHeight, "Date Range", `${filters.startDate || "Any"} -> ${filters.endDate || "Any"}`);
  drawCard(marginX + filterWidth + filterGap, y, filterWidth, filterCardHeight, "Search", filters.search.trim() || "None");
  y += filterCardHeight + 20;

  const totalWorkouts = workouts.length;
  const activeDays = new Set(workouts.map((workout) => workout.date)).size;
  const totalGroups = chartData.length;
  const activitySummary = activity.reduce(
    (acc, current) => {
      acc.steps += current.steps;
      acc.distance += current.distanceKm;
      acc.calories += current.calories;
      acc.minutes += current.activeMinutes;
      return acc;
    },
    { steps: 0, distance: 0, calories: 0, minutes: 0 }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Summary", marginX, y);
  y += 10;

  const summaryGap = 8;
  const summaryWidth = (contentWidth - summaryGap * 2) / 3;
  const summaryHeight = 56;
  drawCard(marginX, y, summaryWidth, summaryHeight, "Visible Workouts", `${totalWorkouts}`);
  drawCard(marginX + summaryWidth + summaryGap, y, summaryWidth, summaryHeight, "Muscle Groups", `${totalGroups}`);
  drawCard(marginX + (summaryWidth + summaryGap) * 2, y, summaryWidth, summaryHeight, "Active Days", `${activeDays}`);
  y += summaryHeight + 8;

  drawCard(marginX, y, summaryWidth, summaryHeight, "Total Steps", activitySummary.steps.toLocaleString());
  drawCard(marginX + summaryWidth + summaryGap, y, summaryWidth, summaryHeight, "Calories", activitySummary.calories.toLocaleString());
  drawCard(
    marginX + (summaryWidth + summaryGap) * 2,
    y,
    summaryWidth,
    summaryHeight,
    "Active Min",
    activitySummary.minutes.toLocaleString()
  );
  y += summaryHeight + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Goals & Streaks", marginX, y);
  y += 10;
  drawCard(marginX, y, filterWidth, 52, "Goal Period", goal?.period ?? "daily");
  drawCard(
    marginX + filterWidth + filterGap,
    y,
    filterWidth,
    52,
    "Current / Longest Streak",
    `${streaks?.currentStreak ?? 0} / ${streaks?.longestStreak ?? 0} days`
  );
  y += 68;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Workout Entries", marginX, y);
  y += 14;

  const colHeaders = ["Date", "User", "Group", "Exercises", "Sets/Reps", "Notes"];
  const colWidths = [72, 78, 78, 120, 68, contentWidth - (72 + 78 + 78 + 120 + 68)];
  const rowPaddingY = 8;

  const drawTableHeader = () => {
    doc.setFillColor(...colors.navy);
    doc.roundedRect(marginX, y, contentWidth, 24, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);

    let x = marginX;
    colHeaders.forEach((header, index) => {
      doc.text(header, x + 6, y + 16);
      x += colWidths[index];
    });
    y += 26;
  };

  const startNewPage = () => {
    doc.addPage();
    y = topMargin;
    drawHeaderBand();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.textDark);
    doc.text("Workout Entries (cont.)", marginX, y);
    y += 14;
    drawTableHeader();
  };

  if (!workouts.length) {
    doc.setFillColor(...colors.bgSoft);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(marginX, y, contentWidth, 46, 8, 8, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.textMuted);
    doc.text("No workouts matched the selected filters.", marginX + 12, y + 28);
  } else {
    drawTableHeader();
    workouts.forEach((workout, index) => {
      const values = [
        workout.date || "-",
        workout.username || "-",
        workout.musclegroup || "-",
        workout.exercises || "-",
        workout.setsreps || "-",
        workout.notes || "-",
      ];
      const wrappedColumns = values.map((value, valueIndex) =>
        doc.splitTextToSize(value, colWidths[valueIndex] - 12) as string[]
      );
      const maxLines = Math.max(...wrappedColumns.map((lines) => lines.length));
      const rowHeight = Math.max(22, maxLines * 11 + rowPaddingY * 2 - 4);

      if (y + rowHeight > pageHeight - bottomMargin - 18) {
        startNewPage();
      }

      doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
      doc.setDrawColor(...colors.border);
      doc.rect(marginX, y, contentWidth, rowHeight, "FD");

      let x = marginX;
      wrappedColumns.forEach((columnLines, columnIndex) => {
        doc.setFont("helvetica", columnIndex === 3 ? "bold" : "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.textDark);
        doc.text(columnLines, x + 6, y + 14);
        x += colWidths[columnIndex];
      });
      y += rowHeight;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...colors.border);
    doc.line(marginX, pageHeight - 24, pageWidth - marginX, pageHeight - 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.textMuted);
    doc.text("FitSheet", marginX, pageHeight - 10);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - marginX - 60, pageHeight - 10);
  }

  const reportDate = new Date().toISOString().slice(0, 10);
  doc.save(`fitsheet-report-${reportDate}.pdf`);
};
