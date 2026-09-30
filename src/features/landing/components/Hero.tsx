"use client";

import Logo from "@/components/ui/Logo";
import { useRouter } from "next/navigation";

const Hero = () => {
  const router = useRouter();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <video
        src="/videobg.webm"
        poster="/bg.avif"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0  bg-black/90" />
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-white/15 to-transparent to-70%" />

      <div className="space-y-5 relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
        <div className="flex flex-col space-y-2">
          <Logo as="h1" size="md" white />
          <span className="text-xs md:text-sm">
            Every bet, every number. Nothing else.
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="bg-white  cursor-pointer hover:scale-[1.03] rounded-xl text-black font-sans  px-12 sm:x-20 border-gradient py-3 sm:py-3.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]"
        >
          <span>Start Now</span>
        </button>
      </div>
    </section>
  );
};

export default Hero;
