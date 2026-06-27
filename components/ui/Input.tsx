import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        {...props}
        className={`
          w-full px-4 py-3 rounded-xl border text-base
          focus:outline-none focus:ring-2 focus:ring-primary-400
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? "border-red-400" : "border-gray-300"}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
