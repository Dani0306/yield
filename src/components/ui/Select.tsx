import { ChevronDown } from "lucide-react";

type SelectProps = {
  label: string;
  name: string;
  value: string;
  setValue: (value: string) => void;
  options: readonly string[];
  // Shown first, with no value, until something is picked.
  placeholder?: string;
};

// A native <select> styled like Input.
const Select = ({
  label,
  name,
  value,
  setValue,
  options,
  placeholder = "Choose…",
}: SelectProps) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-normal text-gray-800" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`w-full cursor-pointer appearance-none border border-gray-300 bg-white py-2.5 pr-9 pl-3 text-sm font-extralight outline-none transition-shadow focus:border-black focus:ring-1 focus:ring-black ${value ? "text-gray-800" : "text-gray-400"}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="text-gray-800">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
};

export default Select;
