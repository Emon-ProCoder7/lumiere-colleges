"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<"signin" | "reset">("signin");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "reset") {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      setLoading(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setResetSent(true);
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError("That email and password don't match. Check and try again.");
      return;
    }

    const next = searchParams.get("next") || "/";
    router.replace(next);
    router.refresh();
  }

  function onButtonMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
    setButtonOffset({ x, y });
  }

  function onButtonMouseLeave() {
    setButtonOffset({ x: 0, y: 0 });
  }

  return (
    <motion.div className={styles.panel} variants={container} initial="hidden" animate="visible">
      <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Image src="/logo.png" alt="" width={28} height={28} style={{ borderRadius: 7 }} />
        <span style={{ color: "oklch(90% 0.01 85)", fontSize: "0.8125rem", fontWeight: 600 }}>
          Lumiere College Group
        </span>
      </motion.div>

      <motion.div variants={item}>
        <div className={styles.panelTitle}>{mode === "signin" ? "Sign in" : "Reset your password"}</div>
        <div className={styles.panelSubtitle}>
          {mode === "signin"
            ? "Live operations for all 12 colleges, calls and voicemails in one place."
            : "Enter your email and we'll send you a reset link."}
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div className={styles.field} variants={item}>
          <label className={styles.fieldLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={styles.fieldInput}
            placeholder="you@lumiere.edu.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </motion.div>

        {mode === "signin" ? (
          <motion.div className={styles.field} variants={item}>
            <label className={styles.fieldLabel} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={styles.fieldInput}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </motion.div>
        ) : null}

        {error ? (
          <motion.div className={styles.errorText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        ) : null}

        {resetSent ? (
          <motion.div className={styles.successText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Check your inbox for a reset link.
          </motion.div>
        ) : null}

        <motion.button
          ref={buttonRef}
          type="submit"
          className={styles.submitButton}
          disabled={loading}
          variants={item}
          onMouseMove={onButtonMouseMove}
          onMouseLeave={onButtonMouseLeave}
          animate={{ x: buttonOffset.x, y: buttonOffset.y }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Send reset link"}
        </motion.button>

        <motion.div variants={item}>
          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => {
              setMode(mode === "signin" ? "reset" : "signin");
              setError(null);
              setResetSent(false);
            }}
          >
            {mode === "signin" ? "Forgot your password?" : "Back to sign in"}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
