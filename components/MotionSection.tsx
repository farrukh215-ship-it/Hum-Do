"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function MotionSection({
  children,
  index,
  className,
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : index * 0.12, duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
