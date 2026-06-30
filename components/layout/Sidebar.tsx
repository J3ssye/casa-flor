"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Margarida from "@/components/ui/floral/Margarida";
import DivisorFloral from "@/components/ui/floral/DivisorFloral";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const adminItems: NavItem[] = [
  { href: "/admin/moradoras",   label: "Moradoras",   icon: "👥" },
  { href: "/admin/areas",       label: "Áreas",       icon: "🏡" },
  { href: "/admin/tarefas",     label: "Tarefas",     icon: "🗂️" },
  { href: "/admin/escala",      label: "Escala",      icon: "📋" },
  { href: "/admin/calendario",  label: "Calendário",  icon: "📅" },
  { href: "/admin/aniversariantes", label: "Aniversários", icon: "🎂" },
  { href: "/admin/avisos",      label: "Avisos",      icon: "📢" },
  { href: "/admin/reclamacoes", label: "Reclamações", icon: "💬" },
  { href: "/admin/financeiro",  label: "Financeiro",  icon: "💰" },
];

const moradoraItems: NavItem[] = [
  { href: "/moradora/inicio",      label: "Início",        icon: "🏠" },
  { href: "/moradora/tarefas",     label: "Minhas Tarefas", icon: "✅" },
  { href: "/moradora/escala",      label: "Escala Geral",  icon: "📋" },
  { href: "/moradora/calendario",  label: "Calendário",    icon: "📅" },
  { href: "/moradora/aniversariantes", label: "Aniversários", icon: "🎂" },
  { href: "/moradora/avisos",      label: "Avisos",        icon: "📢" },
  { href: "/moradora/reclamacoes", label: "Reclamações",   icon: "💬" },
  { href: "/moradora/financeiro",  label: "Financeiro",    icon: "💰" },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? adminItems : moradoraItems;

  return (
    <aside className="hidden md:flex flex-col w-56 bg-white/70 backdrop-blur-sm border-r border-primary-100 min-h-screen">
      {/* Decoração floral no topo da sidebar */}
      <div className="flex items-center justify-center gap-1 py-3 border-b border-primary-100">
        <Margarida size={16} opacity={0.6} />
        <Margarida size={22} opacity={0.8} />
        <Margarida size={16} opacity={0.6} />
      </div>

      <nav className="flex flex-col gap-1 px-3 py-3 flex-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-primary-50/50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divisor + decoração floral no rodapé */}
      <div className="px-3 pb-4">
        <DivisorFloral />
        <div className="flex items-center justify-center gap-2 mt-2">
          <Margarida size={14} opacity={0.45} />
          <Margarida size={18} opacity={0.55} />
          <Margarida size={14} opacity={0.45} />
        </div>
      </div>
    </aside>
  );
}
