import React from "react";

export default function Badge({ variant = "success", children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
