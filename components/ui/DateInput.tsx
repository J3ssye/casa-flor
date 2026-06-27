"use client";

import { useState, useEffect } from "react";

interface DateInputProps {
  label?: string;
  value: string;           // ISO: yyyy-mm-dd
  onChange: (e: { target: { value: string } }) => void;
  min?: string;            // ISO: yyyy-mm-dd
  placeholder?: string;
  className?: string;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export default function DateInput({
  label, value, onChange, min, placeholder = "dd/mm/aaaa", className = "",
}: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 8);

    // Formata automaticamente com barras
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    else if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);

    setDisplay(formatted);

    if (digits.length === 8) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      onChange({ target: { value: `${y}-${m}-${d}` } });
    } else {
      onChange({ target: { value: "" } });
    }
  }

  // Valida min visualmente (não bloqueia, só não aplicamos min em texto)
  const minDate = min ? new Date(min) : null;
  const currentDate = value ? new Date(value) : null;
  const belowMin = minDate && currentDate && currentDate < minDate;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-primary-400 ${
          belowMin ? "border-red-400" : "border-gray-300"
        } ${className}`}
      />
      {belowMin && (
        <p className="text-xs text-red-500">Data anterior à entrada</p>
      )}
    </div>
  );
}
