"use client";

import { useState } from "react";
import styles from "./lumiere.module.css";
import type { RangePreset } from "@/lib/lumiere/types";

export type RangeValue = { kind: "preset"; preset: RangePreset } | { kind: "custom"; from: string; to: string };

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function RangeSelector({ value, onChange }: { value: RangeValue; onChange: (next: RangeValue) => void }) {
  const [customOpen, setCustomOpen] = useState(value.kind === "custom");
  const [from, setFrom] = useState(value.kind === "custom" ? value.from.slice(0, 10) : daysAgoIso(7));
  const [to, setTo] = useState(value.kind === "custom" ? value.to.slice(0, 10) : todayIso());

  return (
    <div className={styles.rangeSelector}>
      <div className={styles.rangeSegmented} role="group" aria-label="Time range">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={styles.rangeButton}
            data-active={value.kind === "preset" && value.preset === p.value}
            onClick={() => {
              setCustomOpen(false);
              onChange({ kind: "preset", preset: p.value });
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={styles.rangeButton}
          data-active={value.kind === "custom"}
          onClick={() => setCustomOpen((v) => !v)}
        >
          Custom
        </button>
      </div>
      {customOpen ? (
        <div className={styles.rangeCustom}>
          <label className={styles.rangeCustomField}>
            From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className={styles.rangeCustomField}>
            To
            <input type="date" value={to} min={from} max={todayIso()} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button
            type="button"
            className={styles.rangeApplyButton}
            onClick={() => onChange({ kind: "custom", from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` })}
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
