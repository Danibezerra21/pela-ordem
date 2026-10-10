"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  LayoutDashboard,
  ClipboardList,
  UsersRound,
  CircleAlert,
  FileSpreadsheet,
  History,
  ChartNoAxesColumnIncreasing,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";

import {
  sair,
} from "@/app/auth/logout/actions";


export type TipoAcessoSidebar =
  | "master"
  | "operacional"
  | "financeiro"
  | "sem_vinculo";


type ItemMenu = {
  nome:
    string;

  href:
    string;

  icone:
    typeof LayoutDashboard;

  acessos:
    TipoAcessoSidebar[];
};


const itensMenu:
  ItemMenu[] = [

  {
    nome:
      "Dashboard",

    href:
      "/protected",

    icone:
      LayoutDashboard,

    acessos: [
      "master",
      "operacional",
    ],
  },

  {
    nome:
      "Diligências",

    href:
      "/protected/diligencias",

    icone:
      ClipboardList,

    acessos: [
      "master",
      "operacional",
      "financeiro",
    ],
  },

  {
    nome:
      "Correspondentes",

    href:
      "/protected/correspondentes",

    icone:
      UsersRound,

    acessos: [
      "master",
      "operacional",
    ],
  },

  {
    nome:
      "Verificar pendências",

    href:
      "/protected/pendencias",

    icone:
      CircleAlert,

    acessos: [
      "master",
      "operacional",
    ],
  },

  {
    nome:
      "Importar pauta",

    href:
      "/protected/importacoes",

    icone:
      FileSpreadsheet,

    acessos: [
      "master",
      "operacional",
    ],
  },

  {
    nome:
      "Relatórios",

    href:
      "/protected/relatorios",

    icone:
      ChartNoAxesColumnIncreasing,

    acessos: [
      "master",
      "operacional",
      "financeiro",
    ],
  },

  {
    nome:
      "Usuários",

    href:
      "/protected/usuarios",

    icone:
      UserCog,

    acessos: [
      "master",
    ],
  },

  {
    nome:
      "Auditoria",

    href:
      "/protected/auditoria",

    icone:
      History,

    acessos: [
      "master",
    ],
  },

  {
    nome:
      "Configurações",

    href:
      "/protected/configuracoes",

    icone:
      Settings,

    acessos: [
      "master",
    ],
  },
];


export function Sidebar({
  tipoAcesso,
}: {
  tipoAcesso:
    TipoAcessoSidebar;
}) {

  const pathname =
    usePathname();


  const itensVisiveis =
    itensMenu.filter(
      (
        item
      ) =>
        item
          .acessos
          .includes(
            tipoAcesso
          )
    );


  const hrefMarca =
    tipoAcesso ===
      "financeiro"

      ? "/protected/diligencias?filtro=pagamento_pendente"

      : "/protected";


  return (
    <aside className="flex min-h-screen w-72 flex-col bg-[#0b1f3a] text-white">

      {/* Marca */}

      <div className="border-b border-white/10 px-7 py-8">

        <Link
          href={
            hrefMarca
          }
        >

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

        {itensVisiveis.map(
          (
            item
          ) => {

            const Icone =
              item.icone;


            const ativo =
              item.href ===
              "/protected"

                ? pathname ===
                  "/protected"

                : pathname.startsWith(
                    item.href
                  );


            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                  ativo
                    ? "bg-white/10 font-medium text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >

                <Icone className="h-4 w-4" />

                <span>
                  {item.nome}
                </span>

              </Link>
            );
          }
        )}

      </nav>


      {/* Rodapé */}

      <div className="border-t border-white/10 px-4 py-5">

        <form
          action={
            sair
          }
        >

          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >

            <LogOut className="h-4 w-4" />

            <span>
              Sair
            </span>

          </button>

        </form>


        <div className="mt-4 px-3">

          <p className="text-xs text-white/45">
            NOTE LITIS
          </p>

          <p className="mt-1 text-xs text-white/30">
            Sistema de gestão de diligências
          </p>

        </div>

      </div>

    </aside>
  );
}