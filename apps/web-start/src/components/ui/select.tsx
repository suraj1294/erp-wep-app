import { useState } from "react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export function Select({ value, placeholder, children, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder || "Select..."}
        </span>
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect: (value: string) => void;
}

export function SelectItem({ value, children, onSelect }: SelectItemProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect(value);
        // Close parent - handled by parent state
      }}
      className="flex w-full items-center px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
