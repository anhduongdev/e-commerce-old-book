"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { getHealth } from "@/services/health";

type Status = "loading" | "connected" | "error";

export function BackendStatus() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    getHealth()
      .then(() => setStatus("connected"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return <p className="text-text-muted">Checking backend connection...</p>;
  }

  if (status === "error") {
    return (
      <p className="flex items-center gap-2 text-error">
        <XCircle size={18} aria-hidden="true" />
        Backend: connection failed
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-success">
      Backend: connected
      <CheckCircle2 size={18} aria-hidden="true" />
    </p>
  );
}
