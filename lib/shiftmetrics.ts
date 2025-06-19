'use client'
import { useMemo } from "react";
import type { AnalysisResult } from "@/lib/data-analysis";

/** ----------------------------------------------------------------
 * The canonical list (and display order) of shift names used
 * everywhere in the UI.  Update here once and both the chart & table
 * stay in sync.
 * ----------------------------------------------------------------*/
export const SHIFT_NAMES = [
  "Front Half Day",    // Sunday‑Tuesday 04:30–16:30
  "Front Half Night",  // Sunday‑Tuesday 16:30–04:30
  "Back Half Day",     // Thursday‑Saturday 04:30–16:30
  "Back Half Night",   // Thursday‑Saturday 16:30–04:30
  "Wednesday Day",     // Wednesday 04:30–16:30  (shared)
  "Wednesday Night"    // Wednesday 16:30–04:30 (shared)
] as const;

export type ShiftName = (typeof SHIFT_NAMES)[number];

export function useShiftMetrics(
  analysis: AnalysisResult,
  period: "1mo" | "3mo" | "6mo" | "all"
) {
  const counts = useMemo(() => {
    switch (period) {
      case "1mo": return analysis.last1MonthShiftCounts;
      case "3mo": return analysis.last3MonthsShiftCounts;
      case "6mo": return analysis.last6MonthsShiftCounts;
      default:    return analysis.shiftCounts;
    }
  }, [analysis, period]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return { counts, total };
}