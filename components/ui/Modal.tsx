"use client";

import { useEffect } from "react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}

export default function Modal({ aberto, onFechar, titulo, children }: ModalProps) {
  // No iOS, "overflow: hidden" no body não trava o scroll por toque — a página
  // de fundo continua "elástica" e volta com um salto ao soltar o dedo. Travar
  // via position:fixed remove o body do fluxo rolável de verdade.
  useEffect(() => {
    if (!aberto) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";

    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onFechar}
        aria-hidden="true"
      />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl p-6 z-10 max-h-[90svh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
