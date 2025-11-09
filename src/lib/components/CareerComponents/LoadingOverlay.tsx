"use client";

import React from "react";
import styles from "@/lib/styles/screens/careerForm.module.scss";

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
}

/**
 * Loading Overlay Component
 * Displays a full-screen loading indicator with optional message
 * Used during async operations like saving drafts or publishing careers
 */
export default function LoadingOverlay({ message = "Saving...", submessage }: LoadingOverlayProps) {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContent}>
        <div className={styles.spinner}></div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
          {message}
        </p>
        {submessage && (
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}
