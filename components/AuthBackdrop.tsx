"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import styles from "./auth.module.css";
import { EmberParticles } from "./EmberParticles";

const IMAGES = ["/login/hero-1.png", "/login/hero-2.png"];
const CYCLE_MS = 9000;

export function AuthBackdrop() {
  const [index, setIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Continuous slow Ken Burns zoom, independent of the crossfade timing,
  // so the motion never feels like it's resetting in sync with the swap.
  useEffect(() => {
    if (!imageRef.current) return;
    const tween = gsap.fromTo(
      imageRef.current,
      { scale: 1.08 },
      { scale: 1, duration: 22, ease: "sine.inOut", repeat: -1, yoyo: true }
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className={styles.bgLayer}>
      <div ref={imageRef} style={{ position: "absolute", inset: 0 }}>
        <AnimatePresence>
          <motion.div
            key={index}
            className={styles.bgImage}
            style={{ backgroundImage: `url(${IMAGES[index]})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
          />
        </AnimatePresence>
      </div>
      <div className={styles.bgScrim} />
      <div className={styles.bgScrimBottom} />
      <div className={styles.particles}>
        <EmberParticles />
      </div>
    </div>
  );
}
