"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import styles from "./lumiere.module.css";
import {
  formatCount,
  formatDuration,
  formatRelativeTime,
  formatClock,
  formatPhoneDisplay,
} from "@/lib/format";
import type { LumiereOverview, CollegeSummary } from "@/lib/lumiere/types";

const REFRESH_MS = 30_000;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function durationTone(durationSeconds: number, status: string | null): "good" | "warn" | "critical" {
  if (durationSeconds > 0) return "good";
  if (status && /no.?answer|missed|busy|fail/i.test(status)) return "critical";
  return "warn";
}

export function LumiereClient({ initialData }: { initialData: LumiereOverview }) {
  const [data, setData] = useState(initialData);
  const [lastFetched, setLastFetched] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedCode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCode]);

  const activeColleges = new Set(
    data.colleges.filter((c) => c.callCount24h > 0 || c.voicemailCount24h > 0).map((c) => c.code)
  );

  const selectedCollege = data.colleges.find((c) => c.code === selectedCode) ?? null;
  const selectedVoicemails = selectedCode
    ? data.recentVoicemails.filter((v) => v.collegeCode === selectedCode)
    : [];
  const selectedCalls = selectedCode ? data.recentCalls.filter((c) => c.collegeCode === selectedCode) : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Image src="/logo.png" alt="Lumiere" width={40} height={40} className={styles.logo} priority />
          <div>
            <div className={styles.title}>Lumiere College Group — Live Operations</div>
            <div className={styles.subtitle}>Calls and voicemails by college, last 24 hours</div>
          </div>
        </div>
        <div className={styles.refreshRow}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span>Updated {formatRelativeTime(new Date(lastFetched).toISOString())}</span>
          <button className={styles.refreshButton} onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <div className={styles.statLabel}>Calls, 24h</div>
          <div className={styles.statValue}>{formatCount(data.kpis.totalCalls24h)}</div>
        </motion.div>
        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: EASE_OUT }}
        >
          <div className={styles.statLabel}>Voicemails, 24h</div>
          <div className={styles.statValue}>{formatCount(data.kpis.totalVoicemails24h)}</div>
        </motion.div>
        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: EASE_OUT }}
        >
          <div className={styles.statLabel}>Colleges with activity</div>
          <div className={styles.statValue}>
            {data.kpis.collegesWithActivity24h} / {data.colleges.length}
          </div>
        </motion.div>
      </div>

      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>By college</div>
        <div className={styles.sectionHint}>Click a college to see its activity</div>
      </div>
      <div className={styles.collegeGrid}>
        {data.colleges.map((c, i) => (
          <motion.button
            key={c.code}
            type="button"
            className={styles.collegeCard}
            data-active={activeColleges.has(c.code)}
            onClick={() => setSelectedCode(c.code)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.035, 0.28), ease: EASE_OUT }}
          >
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
          </motion.button>
        ))}
      </div>

      <div className={styles.twoCol}>
        <div>
          <div className={styles.sectionTitle}>Recent voicemails</div>
          {data.recentVoicemails.length === 0 ? (
            <div className={styles.empty}>No voicemails yet. They&apos;ll appear here as they come in.</div>
          ) : (
            <div className={styles.list}>
              {data.recentVoicemails.map((vm, i) => (
                <motion.div
                  key={vm.id}
                  className={styles.listItem}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.24), ease: EASE_OUT }}
                >
                  <div className={styles.listItemTop}>
                    <span className={styles.listItemCollege}>{vm.collegeName}</span>
                    <span className={styles.listItemTime}>
                      {formatClock(vm.receivedAt)} &middot; {formatRelativeTime(vm.receivedAt)}
                    </span>
                  </div>
                  <div className={styles.listItemFrom}>
                    From {formatPhoneDisplay(vm.fromNumber)} &middot; {formatDuration(vm.durationSeconds)}
                  </div>
                  {vm.transcription ? (
                    <div className={styles.transcription}>&ldquo;{vm.transcription}&rdquo;</div>
                  ) : null}
                </motion.div>
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
              {data.recentCalls.map((call, i) => (
                <motion.div
                  key={call.id}
                  className={styles.listItem}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.24), ease: EASE_OUT }}
                >
                  <div className={styles.listItemTop}>
                    <span className={styles.listItemCollege}>{call.collegeName}</span>
                    <span className={styles.listItemTime}>
                      {call.startedAt ? formatClock(call.startedAt) : "—"}
                      {call.startedAt ? ` · ${formatRelativeTime(call.startedAt)}` : ""}
                    </span>
                  </div>
                  <div className={styles.listItemFrom}>
                    {call.direction ?? "Call"} from {formatPhoneDisplay(call.fromNumber)} &middot;{" "}
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedCollege ? (
          <CollegeDetailModal
            college={selectedCollege}
            voicemails={selectedVoicemails}
            calls={selectedCalls}
            onClose={() => setSelectedCode(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CollegeDetailModal({
  college,
  voicemails,
  calls,
  onClose,
}: {
  college: CollegeSummary;
  voicemails: LumiereOverview["recentVoicemails"];
  calls: LumiereOverview["recentCalls"];
  onClose: () => void;
}) {
  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-label={`${college.displayName} activity`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: EASE_OUT } }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>{college.displayName}</div>
            <div className={styles.collegeNumbers}>
              {college.existingNumber} &middot; {college.localNumber}
            </div>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>Voicemails ({voicemails.length})</div>
            {voicemails.length === 0 ? (
              <div className={styles.empty}>No voicemails from this college yet.</div>
            ) : (
              <div className={styles.list}>
                {voicemails.map((vm) => (
                  <div key={vm.id} className={styles.listItem}>
                    <div className={styles.listItemTop}>
                      <span className={styles.listItemFrom} style={{ marginTop: 0 }}>
                        {formatPhoneDisplay(vm.fromNumber)}
                      </span>
                      <span className={styles.listItemTime}>
                        {formatClock(vm.receivedAt)} &middot; {formatRelativeTime(vm.receivedAt)}
                      </span>
                    </div>
                    <div className={styles.listItemFrom}>{formatDuration(vm.durationSeconds)}</div>
                    {vm.transcription ? (
                      <div className={styles.transcription}>&ldquo;{vm.transcription}&rdquo;</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>Calls ({calls.length})</div>
            {calls.length === 0 ? (
              <div className={styles.empty}>No calls from this college yet.</div>
            ) : (
              <div className={styles.list}>
                {calls.map((call) => (
                  <div key={call.id} className={styles.listItem}>
                    <div className={styles.listItemTop}>
                      <span className={styles.listItemFrom} style={{ marginTop: 0 }}>
                        {formatPhoneDisplay(call.fromNumber)}
                      </span>
                      <span className={styles.listItemTime}>
                        {call.startedAt ? formatClock(call.startedAt) : "—"}
                      </span>
                    </div>
                    <div className={styles.listItemFrom}>
                      {call.direction ?? "Call"} &middot; {formatDuration(call.durationSeconds)}
                      {call.status ? (
                        <>
                          {" "}
                          <span
                            className={styles.badge}
                            data-tone={durationTone(call.durationSeconds, call.status)}
                          >
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
      </motion.div>
    </motion.div>
  );
}
