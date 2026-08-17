import { BackendStatus } from "@/components/common/BackendStatus";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold">Comic Store</h1>
      <p className="text-zinc-600">Frontend is running</p>
      <BackendStatus />
    </main>
  );
}
