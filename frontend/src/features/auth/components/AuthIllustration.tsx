import Image from "next/image";

export function AuthIllustration() {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl bg-cream lg:block">
      <Image
        src="/image-register-page.png"
        alt="Chào mừng bạn đến với Tiệm Sách Xưa"
        fill
        sizes="(min-width: 1024px) 50vw, 0px"
        className="object-contain"
        priority
      />
    </div>
  );
}
