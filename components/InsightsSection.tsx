"use client";

import { Fragment } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./lumiere.module.css";
import type { LumiereAnalytics } from "@/lib/lumiere/types";

const COLOR_GOOD = "oklch(50% 0.13 152)";
const COLOR_WARN = "oklch(58% 0.15 55)";
const COLOR_CRITICAL = "oklch(52% 0.19 25)";
const COLOR_LINE = "oklch(85% 0.012 85)";
const COLOR_FG_DIM = "oklch(42% 0.018 262)";
const COLOR_FG_FAINT = "oklch(56% 0.014 262)";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function answerRateTone(pct: number): "critical" | "warn" | "good" {
  if (pct < 50) return "critical";
  if (pct < 80) return "warn";
  return "good";
}

function answerRateColor(pct: number): string {
  const tone = answerRateTone(pct);
  return tone === "critical" ? COLOR_CRITICAL : tone === "warn" ? COLOR_WARN : COLOR_GOOD;
}

function heatColor(ratio: number): string {
  if (ratio <= 0) return "oklch(93% 0.006 85)";
  const lightness = 88 - ratio * 48;
  const chroma = 0.03 + ratio * 0.12;
  return `oklch(${lightness}% ${chroma} 75)`;
}

type TooltipPayloadItem = { name?: string; value?: number; color?: string };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={p.name ?? i} className={styles.chartTooltipRow}>
          <span className={styles.chartTooltipDot} style={{ background: p.color }} aria-hidden="true" />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function InsightsSection({
  analytics,
  rangeLabel,
  totalCalls,
}: {
  analytics: LumiereAnalytics;
  rangeLabel: string;
  totalCalls: number;
}) {
  const { callVolume, collegeAnswerRates, heatmap, answerRatePct, avgAnsweredDurationSeconds, previousPeriod } = analytics;

  const hasCallData = callVolume.some((b) => b.answered + b.voicemail + b.abandoned > 0);
  const tickInterval = callVolume.length > 10 ? Math.ceil(callVolume.length / 10) : 0;

  const maxHeat = Math.max(1, ...heatmap.map((c) => c.count));
  const activeHours = Array.from(new Set(heatmap.filter((c) => c.count > 0).map((c) => c.hour))).sort((a, b) => a - b);
  const hourRange = activeHours.length > 0 ? { min: Math.min(...activeHours, 7), max: Math.max(...activeHours, 19) } : { min: 7, max: 19 };
  const hours = Array.from({ length: hourRange.max - hourRange.min + 1 }, (_, i) => hourRange.min + i);

  const answerDelta = previousPeriod ? answerRatePct - previousPeriod.answerRatePct : null;

  return (
    <div className={styles.insights}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>Business insights</div>
        <div className={styles.sectionHint}>{rangeLabel}, Melbourne time</div>
      </div>

      <div className={styles.insightsKpiRow}>
        <div className={styles.insightsKpi}>
          <div className={styles.statLabel}>Answer rate</div>
          <div className={styles.statValue} data-tone={answerRateTone(answerRatePct)}>
            {answerRatePct}%
          </div>
          {answerDelta !== null ? (
            <div className={styles.insightsDelta} data-positive={answerDelta >= 0}>
              {answerDelta >= 0 ? "▲" : "▼"} {Math.abs(answerDelta)} pts vs previous period
            </div>
          ) : null}
        </div>
        <div className={styles.insightsKpi}>
          <div className={styles.statLabel}>Avg. answered call length</div>
          <div className={styles.statValue}>{Math.round(avgAnsweredDurationSeconds / 60) || "<1"}m</div>
        </div>
        {previousPeriod ? (
          <div className={styles.insightsKpi}>
            <div className={styles.statLabel}>Call volume</div>
            <div className={styles.statValue}>{totalCalls}</div>
            <div className={styles.insightsDelta} data-positive={totalCalls >= previousPeriod.totalCalls}>
              {totalCalls >= previousPeriod.totalCalls ? "▲" : "▼"} vs {previousPeriod.totalCalls} previous period
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartCardTitle}>Call volume &amp; outcome</div>
        <div className={styles.chartCardHint}>
          Are inquiries growing, and are we handling them? Green is answered live, amber went to voicemail, red rang out
          unanswered.
        </div>
        {hasCallData ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={callVolume} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COLOR_LINE} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: COLOR_FG_FAINT }}
                axisLine={{ stroke: COLOR_LINE }}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis tick={{ fontSize: 11, fill: COLOR_FG_FAINT }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(90% 0.008 85 / 0.5)" }} />
              <Bar dataKey="answered" name="Answered" stackId="o" fill={COLOR_GOOD} radius={[0, 0, 0, 0]} />
              <Bar dataKey="voicemail" name="Voicemail" stackId="o" fill={COLOR_WARN} />
              <Bar dataKey="abandoned" name="No answer" stackId="o" fill={COLOR_CRITICAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.empty}>No calls in this range yet.</div>
        )}
      </div>

      <div className={styles.twoCol}>
        <div className={styles.chartCard}>
          <div className={styles.chartCardTitle}>Answer rate by college</div>
          <div className={styles.chartCardHint}>Worst first — these colleges are missing the most live inquiries.</div>
          {collegeAnswerRates.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(160, collegeAnswerRates.length * 34)}>
              <BarChart
                data={collegeAnswerRates}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke={COLOR_LINE} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: COLOR_FG_FAINT }} axisLine={{ stroke: COLOR_LINE }} tickLine={false} unit="%" />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  width={120}
                  tick={{ fontSize: 11, fill: COLOR_FG_DIM }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const d = payload[0].payload as (typeof collegeAnswerRates)[number];
                    return (
                      <div className={styles.chartTooltip}>
                        <div className={styles.chartTooltipLabel}>{d.displayName}</div>
                        <div className={styles.chartTooltipRow}>
                          {d.answered} of {d.totalCalls} calls answered live (<strong>{d.answerRatePct}%</strong>)
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: "oklch(90% 0.008 85 / 0.5)" }}
                />
                <Bar dataKey="answerRatePct" radius={[0, 4, 4, 0]}>
                  {collegeAnswerRates.map((entry) => (
                    <Cell key={entry.code} fill={answerRateColor(entry.answerRatePct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>No calls in this range yet.</div>
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCardTitle}>Peak call times</div>
          <div className={styles.chartCardHint}>When calls come in, Melbourne time — use this to plan phone coverage.</div>
          {maxHeat > 0 ? (
            <div className={styles.heatmapWrap}>
              <div className={styles.heatmapGrid} style={{ gridTemplateColumns: `32px repeat(${hours.length}, 1fr)` }}>
                <div />
                {hours.map((h) => (
                  <div key={h} className={styles.heatmapHourLabel}>
                    {h % 3 === 0 ? h : ""}
                  </div>
                ))}
                {DAY_LABELS.map((dayLabel, dayOfWeek) => (
                  <Fragment key={dayLabel}>
                    <div className={styles.heatmapDayLabel}>{dayLabel}</div>
                    {hours.map((h) => {
                      const cell = heatmap.find((c) => c.dayOfWeek === dayOfWeek && c.hour === h);
                      const count = cell?.count ?? 0;
                      return (
                        <div
                          key={`${dayLabel}-${h}`}
                          className={styles.heatmapCell}
                          style={{ background: heatColor(count / maxHeat) }}
                          title={`${dayLabel} ${h}:00 — ${count} call${count === 1 ? "" : "s"}`}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.empty}>No calls in this range yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
