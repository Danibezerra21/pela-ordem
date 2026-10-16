"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  ChartNoAxesColumnIncreasing,
  CircleAlert,
  CircleHelp,
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
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

  exigeAcessoOperacional:
    boolean;
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      true,
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

    exigeAcessoOperacional:
      false,
  },

  {
    nome:
      "Suporte",

    href:
      "/protected/ajuda",

    icone:
      CircleHelp,

    acessos: [
      "master",
      "operacional",
      "financeiro",
    ],

    exigeAcessoOperacional:
      false,
  },
];


export function Sidebar({
  tipoAcesso,
  acessoOperacional,
  administradorPlataforma,
}: {
  tipoAcesso:
    TipoAcessoSidebar;

  acessoOperacional:
    boolean;

  administradorPlataforma:
    boolean;
}) {
  const pathname =
    usePathname();


  /*
   * =====================================================
   * ADMINISTRADOR EXCLUSIVO DA PLATAFORMA
   * =====================================================
   *
   * Não é cliente.
   * Não possui empresa.
   * Não possui mensalidade.
   */

  const administradorExclusivo =
    administradorPlataforma &&
    tipoAcesso ===
      "sem_vinculo";


  /*
   * =====================================================
   * ITENS DO CLIENTE
   * =====================================================
   */

  const itensVisiveis =
    administradorExclusivo
      ? []
      : itensMenu.filter(
          (
            item
          ) => {
            const possuiPerfil =
              item
                .acessos
                .includes(
                  tipoAcesso
                );

            if (
              !possuiPerfil
            ) {
              return false;
            }

            if (
              acessoOperacional
            ) {
              return true;
            }

            return (
              !item
                .exigeAcessoOperacional
            );
          }
        );


  /*
   * =====================================================
   * DESTINO DA MARCA
   * =====================================================
   */

  let hrefMarca =
    "/protected";


  if (
    administradorExclusivo
  ) {
    hrefMarca =
      "/protected/suporte";
  } else if (
    !acessoOperacional
  ) {
    if (
      tipoAcesso ===
      "master"
    ) {
      hrefMarca =
        "/protected/configuracoes";
    } else {
      hrefMarca =
        "/protected/ajuda";
    }
  } else if (
    tipoAcesso ===
    "financeiro"
  ) {
    hrefMarca =
      "/protected/diligencias?filtro=pagamento_pendente";
  }


  return (
    <aside className="flex min-h-screen w-72 flex-col bg-[#0b1f3a] text-white">

      {/* MARCA */}

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
          {administradorExclusivo
            ? "Administração da plataforma"
            : "Gestão de diligências"}
        </p>

      </div>


      {/* NAVEGAÇÃO */}

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


        {/* ADMINISTRAÇÃO DA PLATAFORMA */}

        {administradorPlataforma && (
          <Link
            href="/protected/suporte"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
              pathname.startsWith(
                "/protected/suporte"
              )
                ? "bg-white/10 font-medium text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />

            <span>
              Administração
            </span>
          </Link>
        )}


        {/* AVISO COMERCIAL — SOMENTE CLIENTES */}

        {!administradorExclusivo &&
          !acessoOperacional && (
            <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-4">

              <div className="flex items-start gap-3">

                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />

                <div>

                  <p className="text-sm font-medium text-white">
                    Acesso operacional indisponível
                  </p>

                  {tipoAcesso ===
                  "master" ? (
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Regularize a mensalidade em Configurações para liberar novamente as funções operacionais.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      A mensalidade da empresa precisa ser regularizada pelo usuário Master.
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

      </nav>


      {/* RODAPÉ */}

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
            {administradorExclusivo
              ? "Painel administrativo"
              : "Sistema de gestão de diligências"}
          </p>

        </div>

      </div>

    </aside>
  );
}