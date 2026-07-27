import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-4">
      <Image
        src="/404/fly.svg"
        alt="Página não encontrada"
        width={800}
        height={400}
        unoptimized
        priority
        className="h-auto w-full max-w-2xl"
      />
      <Link href="/cadastros" className={buttonVariants({ variant: "default", size: "lg" })}>
        Voltar ao início
      </Link>
    </div>
  );
}
