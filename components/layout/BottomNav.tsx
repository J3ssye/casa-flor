"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Margarida from "@/components/ui/floral/Margarida";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const adminItems: NavItem[] = [
  { href: "/admin/moradoras", label: "Moradoras", icon: "👥" },
  { href: "/admin/areas",     label: "Áreas",     icon: "🏡" },
  { href: "/admin/tarefas",   label: "Tarefas",   icon: "🗂️" },
  { href: "/admin/escala",    label: "Escala",    icon: "📋" },
  { href: "/admin/calendario", label: "Calendário", icon: "📅" },
  { href: "/admin/avisos",    label: "Avisos",    icon: "📢" },
  { href: "/admin/reclamacoes", label: "Reclamações", icon: "💬" },
  { href: "/admin/financeiro",  label: "Financeiro",  icon: "💰" },
];

const moradoraItems: NavItem[] = [
  { href: "/moradora/inicio", label: "Início", icon: "🏠" },
  { href: "/moradora/tarefas", label: "Tarefas", icon: "✅" },
  { href: "/moradora/escala", label: "Escala", icon: "📋" },
  { href: "/moradora/calendario", label: "Calendário", icon: "📅" },
  { href: "/moradora/avisos", label: "Avisos", icon: "📢" },
  { href: "/moradora/financeiro", label: "Financeiro", icon: "💰" },
];

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? adminItems : moradoraItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-sm border-t border-primary-100 z-30 md:hidden">
      {/* Flores decorativas no topo da barra */}
      <div className="flex justify-center gap-3 pt-1 -mb-1">
        <Margarida size={10} opacity={0.4} />
        <Margarida size={12} opacity={0.5} />
        <Margarida size={10} opacity={0.4} />
      </div>
      <div className="flex">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                active ? "text-primary-600" : "text-gray-400"
              }`}
            >
              <span className={items.length > 5 ? "text-base" : "text-xl"}>{item.icon}</span>
              <span className={items.length > 5 ? "text-[9px] leading-tight" : "text-xs"}>{item.label}</span>
              {active && <Margarida size={8} opacity={0.7} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
