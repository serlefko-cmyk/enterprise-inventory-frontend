"use client";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return <div className={["card", className ?? ""].join(" ").trim()}>{children}</div>;
}
