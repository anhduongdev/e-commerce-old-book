const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface HealthStatus {
  status: string;
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_URL}/health`);

  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }

  return res.json();
}
