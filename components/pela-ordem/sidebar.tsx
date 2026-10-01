"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  UsersRound,
  CircleAlert,
  FileSpreadsheet,
  UserCog,
  Settings,
} from "lucide-react";

const itensMenu = [
  {
    nome: "Dashboard",
    href: "/protected",
    icone: LayoutDashboard,
  },
  {
    nome: "Diligências",
    href: "/protected/diligencias",
    icone: ClipboardList,
  },
  {
    nome: "Correspondentes",
    href: "/protected/correspondentes",
    icone: UsersRound,
  },
  {
    nome: "Verificar pendências",
    href: "/protected/pendencias",
    icone: CircleAlert,
  },
  {
    nome: "Importar pauta",
    href: "/protected/importacoes",
    icone: FileSpreadsheet,
  },
  {
    nome: "Usuários",
    href: "/protected/usuarios",
    icone: UserCog,
  },
  {
    nome: "Configurações",
    href: "/protected/configuracoes",
    icone: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-72 flex-col bg-[#0b1f3a] text-white">
      {/* Marca */}
      <div className="border-b border-white/10 px-7 py-8">
        <Link href="/protected">
          <h1 className="text-3xl font-bold tracking-tight">
            NOTE LITIS
          </h1>

          <p className="mt-1 text-xs text-white/60">
            by Encontre Correspondente
          </p>
        </Link>

        <p className="mt-5 text-sm text-white/75">
          Gestão de diligências
        </p>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
        {itensMenu.map((item) => {
          const Icone = item.icone;

          const ativo =
            item.href === "/protected"
              ? pathname === "/protected"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                ativo
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icone className="h-4 w-4" />

              <span>{item.nome}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-white/10 px-7 py-5">
        <p className="text-xs text-white/45">
          NOTE LITIS
        </p>

        <p className="mt-1 text-xs text-white/30">
          Sistema de gestão de diligências
        </p>
      </div>
    </aside>
  );
}