import { Suspense } from "react";
import Image from "next/image";
import styles from "@/components/auth.module.css";
import { AuthBackdrop } from "@/components/AuthBackdrop";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className={styles.stage}>
      <AuthBackdrop />

      <div className={styles.brandMark}>
        <Image src="/logo.png" alt="Lumiere" width={36} height={36} className={styles.brandLogo} />
        <span className={styles.brandName}>Lumiere College Group</span>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Live operations</div>
        <h1 className={styles.heroTitle}>Every call and voicemail, across all 12 colleges, in one place.</h1>
        <p className={styles.heroSubtitle}>
          Sign in to see who&apos;s calling, who answered, and what still needs a callback, in real time.
        </p>
      </div>

      <div className={styles.panelWrap}>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
