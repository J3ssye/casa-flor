"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Margarida from "@/components/ui/floral/Margarida";

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo com flores */}
        <Link
          href={isAdmin ? "/admin/moradoras" : "/moradora/inicio"}
          className="flex items-center gap-1.5"
        >
          <Margarida size={22} opacity={0.85} />
          <span className="font-script text-2xl text-primary-700 tracking-wide leading-none">
            Casa Flor
          </span>
          <Margarida size={18} opacity={0.7} />
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-700 hidden sm:block">
            {session?.user.name}
          </span>
          <Link
            href="/trocar-senha"
            className="text-sm text-primary-400 hover:text-primary-700 transition-colors"
          >
            Trocar senha
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-primary-400 hover:text-primary-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
