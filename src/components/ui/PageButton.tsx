import React from "react";
import type { LucideIcon } from "lucide-react";

type PageButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
  onClick?: () => void;
};

const PageButton = ({
  onClick,
  text,
  icon: Icon,
  fullWidth = false,
  className = "",
  ...props
}: PageButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex text-sm cursor-pointer items-center justify-center gap-2 px-4 py-3 font-light text-white bg-black transition-colors duration-200 hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-50 ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={1.5} className="shrink-0" />}
      <span>{text}</span>
    </button>
  );
};

export default PageButton;
