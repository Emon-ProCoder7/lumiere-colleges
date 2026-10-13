"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "That Google account isn't approved for this portal. Ask whoever manages access to add it.",
  auth_callback_failed: "That sign-in link didn't go through. Try again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const errorCode = searchParams.get("error");
  const error = errorCode ? ERROR_MESSAGES[errorCode] || "Something went wrong signing in. Try again." : null;

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const next = searchParams.get("next") || "/";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
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
        <div className={styles.panelSubtitle}>
          Live operations for all 12 colleges, calls and voicemails in one place. Access is limited to approved
          accounts.
        </div>
      </motion.div>

      {error ? (
        <motion.div className={styles.errorText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.div>
      ) : null}

      <motion.button
        ref={buttonRef}
        type="button"
        className={styles.googleButton}
        disabled={loading}
        variants={item}
        onClick={handleGoogleSignIn}
        onMouseMove={onButtonMouseMove}
        onMouseLeave={onButtonMouseLeave}
        animate={{ x: buttonOffset.x, y: buttonOffset.y }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <GoogleMark />
        {loading ? "Redirecting…" : "Continue with Google"}
      </motion.button>
    </motion.div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C40.5 36.4 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
