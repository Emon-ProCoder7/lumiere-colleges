"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import styles from "./lumiere.module.css";
import { formatCount, formatDuration, formatRelativeTime, formatClock } from "@/lib/format";
import type { LumiereOverview } from "@/lib/lumiere/types";

const REFRESH_MS = 30_000;

function durationTone(durationSeconds: number, status: string | null): "good" | "warn" | "critical" {
  if (durationSeconds > 0) return "good";
  if (status && /no.?answer|missed|busy|fail/i.test(status)) return "critical";
  return "warn";
}

export function LumiereClient({ initialData }: { initialData: LumiereOverview }) {
  const [data, setData] = useState(initialData);
  const [lastFetched, setLastFetched] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/overview", { cache: "no-store" });
      if (res.ok) {
        const fresh = (await res.json()) as LumiereOverview;
        setData(fresh);
        setLastFetched(Date.now());
      }
    } catch {
      // keep showing the last good data on a transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const activeColleges = new Set(
    data.colleges.filter((c) => c.callCount24h > 0 || c.voicemailCount24h > 0).map((c) => c.code)
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Lumiere College Group — Live Operations</div>
          <div className={styles.subtitle}>Calls and voicemails by college, last 24 hours</div>
        </div>
        <div className={styles.refreshRow}>
          <span>Updated {formatRelativeTime(new Date(lastFetched).toISOString())}</span>
          <button className={styles.refreshButton} onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <motion.div className={styles.statCard} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className={styles.statLabel}>Calls, 24h</div>
          <div className={styles.statValue}>{formatCount(data.kpis.totalCalls24h)}</div>
        </motion.div>
        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className={styles.statLabel}>Voicemails, 24h</div>
          <div className={styles.statValue}>{formatCount(data.kpis.totalVoicemails24h)}</div>
        </motion.div>
        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.statLabel}>Colleges with activity</div>
          <div className={styles.statValue}>
            {data.kpis.collegesWithActivity24h} / {data.colleges.length}
          </div>
        </motion.div>
      </div>

      <div className={styles.sectionTitle}>By college</div>
      <div className={styles.collegeGrid}>
        {data.colleges.map((c) => (
          <div key={c.code} className={styles.collegeCard} data-active={activeColleges.has(c.code)}>
            <div className={styles.collegeName}>{c.displayName}</div>
            <div className={styles.collegeNumbers}>
              {c.existingNumber} &middot; {c.localNumber}
            </div>
            <div className={styles.collegeStats}>
              <span className={styles.collegeStat}>
                Calls <span className={styles.collegeStatValue}>{c.callCount24h}</span>
              </span>
              <span className={styles.collegeStat}>
                Voicemails <span className={styles.collegeStatValue}>{c.voicemailCount24h}</span>
              </span>
            </div>
            <div className={styles.collegeActivity}>
              {c.lastActivityAt
                ? `Last activity ${formatRelativeTime(c.lastActivityAt)}`
                : "No activity in the last 24h"}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        <div>
          <div className={styles.sectionTitle}>Recent voicemails</div>
          {data.recentVoicemails.length === 0 ? (
            <div className={styles.empty}>No voicemails yet. They&apos;ll appear here as they come in.</div>
          ) : (
            <div className={styles.list}>
              {data.recentVoicemails.map((vm) => (
                <div key={vm.id} className={styles.listItem}>
                  <div className={styles.listItemTop}>
                    <span className={styles.listItemCollege}>{vm.collegeName}</span>
                    <span className={styles.listItemTime}>
                      {formatClock(vm.receivedAt)} &middot; {formatRelativeTime(vm.receivedAt)}
                    </span>
                  </div>
                  <div className={styles.listItemFrom}>
                    From {vm.fromNumber ?? "unknown"} &middot; {formatDuration(vm.durationSeconds)}
                  </div>
                  {vm.transcription ? (
                    <div className={styles.transcription}>&ldquo;{vm.transcription}&rdquo;</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className={styles.sectionTitle}>Recent calls</div>
          {data.recentCalls.length === 0 ? (
            <div className={styles.empty}>No calls logged yet. They&apos;ll appear here as they come in.</div>
          ) : (
            <div className={styles.list}>
              {data.recentCalls.map((call) => (
                <div key={call.id} className={styles.listItem}>
                  <div className={styles.listItemTop}>
                    <span className={styles.listItemCollege}>{call.collegeName}</span>
                    <span className={styles.listItemTime}>
                      {call.startedAt ? formatClock(call.startedAt) : "—"}
                      {call.startedAt ? ` · ${formatRelativeTime(call.startedAt)}` : ""}
                    </span>
                  </div>
                  <div className={styles.listItemFrom}>
                    {call.direction ?? "Call"} from {call.fromNumber ?? "unknown"} &middot;{" "}
                    {formatDuration(call.durationSeconds)}
                    {call.status ? (
                      <>
                        {" "}
                        <span className={styles.badge} data-tone={durationTone(call.durationSeconds, call.status)}>
                          {call.status}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
