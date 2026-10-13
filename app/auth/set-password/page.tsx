import { redirect } from "next/navigation";
import Image from "next/image";
import styles from "@/components/auth.module.css";
import { AuthBackdrop } from "@/components/AuthBackdrop";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This link only works once, mid-way through an invite or reset flow.
  // No session here means it already expired or was opened cold.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className={styles.stage}>
      <AuthBackdrop />

      <div className={styles.brandMark}>
        <Image src="/logo.png" alt="Lumiere" width={36} height={36} className={styles.brandLogo} />
        <span className={styles.brandName}>Lumiere College Group</span>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>Almost there</div>
        <h1 className={styles.heroTitle}>One last step before you&apos;re in.</h1>
        <p className={styles.heroSubtitle}>Set a password and you&apos;ll use it every time from now on.</p>
      </div>

      <div className={styles.panelWrap}>
        <SetPasswordForm />
      </div>
    </div>
  );
}
