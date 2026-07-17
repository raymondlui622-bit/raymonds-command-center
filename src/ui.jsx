import React from "react";

export function Card({ children, tint = false }) {
  return <div className={tint ? "card card-tint" : "card"}>{children}</div>;
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

const badgeVariantClass = {
  accent: "badge badge-accent",
  warn: "badge badge-warn",
  neutral: "badge badge-neutral",
};

export function StatusBadge({ children, variant = "neutral" }) {
  return <span className={badgeVariantClass[variant] ?? badgeVariantClass.neutral}>{children}</span>;
}

export function Section({ title, children }) {
  return (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  );
}
