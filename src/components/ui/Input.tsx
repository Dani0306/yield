import React, { HTMLInputTypeAttribute } from "react";
import type { LucideIcon } from "lucide-react";

const Input = ({
  value,
  setValue,
  name,
  type,
  label,
  icon: Icon,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  type: HTMLInputTypeAttribute;
  label: string;
  icon?: LucideIcon;
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-normal text-gray-800" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
        <input
          id={name}
          name={name}
          className={`border w-full border-gray-300 outline-none transition-shadow focus:border-black focus:ring-1 focus:ring-black text-sm font-extralight py-2.5 text-gray-800 ${Icon ? "pl-9 pr-3" : "px-3"}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type={type}
        />
      </div>
    </div>
  );
};

export default Input;
