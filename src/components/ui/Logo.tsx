import React from "react";

const sizes = {
  sm: "text-xl sm:text-2xl",
  md: "text-4xl sm:text-5xl",
  lg: "text-6xl sm:text-8xl",
};

type LogoProps = {
  size?: keyof typeof sizes;
  as?: "span" | "h1";
  white?: boolean;
  className?: string;
};

const Logo = ({
  size = "md",
  as: Tag = "span",
  white = false,
  className = "",
}: LogoProps) => {
  return (
    <Tag
      className={`font-display font-extrabold tracking-normal sm:tracking-wide ${white ? "text-white" : "text-black"} ${sizes[size]} ${className}`}
    >
      Yield.
    </Tag>
  );
};

export default Logo;
