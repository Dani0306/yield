import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Image
        src="/bg.avif"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/90" />
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-white/15 to-transparent to-70%" />

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="font-display text-3xl font-bold tracking-normal sm:text-5xl">
          Bet Tracker
        </h1>
      </div>
    </section>
  );
};

export default Hero;
