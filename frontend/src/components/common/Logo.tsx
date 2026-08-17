import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className ?? ""}`}>
      <Image
        src="/logo.png"
        alt="Tiệm Sách Xưa – Sách cũ – Truyện tranh – Giá trị mới"
        width={1672}
        height={941}
        priority
        className="h-14 w-auto"
      />
    </Link>
  );
}
