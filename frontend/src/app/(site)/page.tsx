import { BookOpen } from "lucide-react";
import { BackendStatus } from "@/components/common/BackendStatus";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-secondary-light via-bg to-bg-secondary">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lightest">
        <BookOpen size={32} className="text-primary-dark" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-semibold text-text">
        Comic <span className="text-primary">Store</span>
      </h1>
      <p className="text-text-secondary">Frontend is running</p>
      <BackendStatus />
    </main>
  );
}
