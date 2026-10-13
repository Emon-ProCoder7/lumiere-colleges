"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import styles from "./auth.module.css";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <motion.div className={styles.panel} variants={container} initial="hidden" animate="visible">
      <motion.div variants={item}>
        <div className={styles.panelTitle}>Set your password</div>
        <div className={styles.panelSubtitle}>Choose a password you&apos;ll use every time you sign in.</div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div className={styles.field} variants={item}>
          <label className={styles.fieldLabel} htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={styles.fieldInput}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </motion.div>

        <motion.div className={styles.field} variants={item}>
          <label className={styles.fieldLabel} htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            className={styles.fieldInput}
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </motion.div>

        {error ? (
          <motion.div className={styles.errorText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        ) : null}

        <motion.button type="submit" className={styles.submitButton} disabled={loading} variants={item}>
          {loading ? "Saving…" : "Save and continue"}
        </motion.button>
      </form>
    </motion.div>
  );
}
