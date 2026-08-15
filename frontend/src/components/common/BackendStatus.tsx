"use client";

import { useEffect, useState } from "react";
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
    return <p className="text-zinc-500">Checking backend connection...</p>;
  }

  if (status === "error") {
    return <p className="text-red-600">Backend: connection failed</p>;
  }

  return <p className="text-green-600">Backend: connected</p>;
}
