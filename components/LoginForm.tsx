"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
import styles from "./auth.module.css";

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

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("That password isn't correct.");
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
        <div className={styles.panelTitle}>Sign in</div>
        <div className={styles.panelSubtitle}>Live operations for all 12 colleges, calls and voicemails in one place.</div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div className={styles.field} variants={item}>
          <label className={styles.fieldLabel} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className={styles.fieldInput}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </motion.div>

        {error ? (
          <motion.div className={styles.errorText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
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
          {loading ? "Signing in…" : "Sign in"}
        </motion.button>
      </form>
    </motion.div>
  );
}
