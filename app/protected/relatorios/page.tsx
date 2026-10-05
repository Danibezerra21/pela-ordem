import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  carregarRelatorio,
  hojeEmRecife,
  inicioMesAtual,
  NOMES_RELATORIOS,
  normalizarTipoRelatorio,
  relatorioFinanceiro,
  type FiltrosRelatorio,
} from "./dados";

import {
  Download,
  FileSpreadsheet,
  Filter,
} from "lucide-react";


type SearchParamsRelatorios = {
  tipo?:
    string | string[];

  inicio?:
    string | string[];

  fim?:
    string | string[];

  tipo_diligencia?:
    string | string[];

  uf?:
    string | string[];

  profissional?:
    string | string[];
};


function primeiro(
  valor:
    string | string[] | undefined
) {

  return Array.isArray(
    valor
  )
    ? (
        valor[0] ??
        ""
      )
    : (
        valor ??
        ""
      );
}


function formatarData(
  valor:
    string | null
) {

  if (!valor) {
    return "—";
  }


  const data =
    valor.slice(
      0,
      10
    );


  const partes =
    data.split("-");


  if (
    partes.length !==
    3
  ) {
    return valor;
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatarProcesso(
  processo:
    string | null
) {

  if (!processo) {
    return "Processo não informado";
  }


  const digitos =
    processo.replace(
      /\D/g,
      ""
    );


  if (
    digitos.length !==
    20
  ) {
    return processo;
  }


  return digitos.replace(
    /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/,
    "$1-$2.$3.$4.$5.$6"
  );
}


function formatarMoeda(
  valor:
    number
) {

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    valor
  );
}


function textoResultado(
  valor:
    string | null
) {

  if (
    valor ===
    "finalidade_atingida"
  ) {
    return "Finalidade atingida";
  }


  if (
    valor ===
    "finalidade_nao_atingida"
  ) {
    return "Finalidade não atingida";
  }


  return "—";
}


export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParamsRelatorios>;
}) {

  const parametros =
    await searchParams;


  const primeiraAbertura =
    Object.keys(
      parametros
    ).length ===
    0;


  const tipo =
    normalizarTipoRelatorio(
      primeiro(
        parametros.tipo
      )
    );


  const inicio =
    primeiraAbertura
      ? inicioMesAtual()
      : primeiro(
          parametros.inicio
        );


  const fim =
    primeiraAbertura
      ? hojeEmRecife()
      : primeiro(
          parametros.fim
        );


  const filtros:
    FiltrosRelatorio = {
      tipo,

      inicio,

      fim,

      tipoDiligencia:
        primeiro(
          parametros
            .tipo_diligencia
        ),

      uf:
        primeiro(
          parametros.uf
        ),

      profissionalId:
        primeiro(
          parametros
            .profissional
        ),
    };


  /* ===================================================
     AUTENTICAÇÃO
  =================================================== */

  const supabase =
    await createClient();


  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase
      .auth
      .getClaims();


  if (
    authError ||
    !authData
      ?.claims
      ?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }


  const usuarioId =
    authData
      .claims
      .sub;


  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(
        "empresa_id, papel, nucleo"
      )
      .eq(
        "usuario_id",
        usuarioId
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();


  if (
    erroMembro
  ) {
    throw new Error(
      `Erro ao localizar empresa: ${erroMembro.message}`
    );
  }


  if (!membro) {
    return (
      <main>
        <h1 className="text-3xl font-bold">
          Relatórios
        </h1>

        <p className="mt-3 text-muted-foreground">
          Seu usuário ainda não possui vínculo ativo com uma empresa.
        </p>
      </main>
    );
  }


  /* ===================================================
     DADOS
  =================================================== */

  const admin =
    createAdminClient();


  const resultado =
    await carregarRelatorio(
      admin,
      membro.empresa_id,
      filtros
    );


  const paramsExportacao =
    new URLSearchParams();


  paramsExportacao.set(
    "tipo",
    filtros.tipo
  );


  paramsExportacao.set(
    "inicio",
    filtros.inicio
  );


  paramsExportacao.set(
    "fim",
    filtros.fim
  );


  if (
    filtros.tipoDiligencia
  ) {
    paramsExportacao.set(
      "tipo_diligencia",
      filtros
        .tipoDiligencia
    );
  }


  if (filtros.uf) {
    paramsExportacao.set(
      "uf",
      filtros.uf
    );
  }


  if (
    filtros.profissionalId
  ) {
    paramsExportacao.set(
      "profissional",
      filtros
        .profissionalId
    );
  }


  const financeiro =
    relatorioFinanceiro(
      filtros.tipo
    );


  const LIMITE_TELA =
    200;


  return (
    <main className="w-full">

      {/* =================================================
          CABEÇALHO
      ================================================== */}

      <section className="mb-8">

        <p className="text-sm font-medium text-muted-foreground">
          Controladoria
        </p>

        <div className="mt-1 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Relatórios
            </h1>

            <p className="mt-2 max-w-3xl text-muted-foreground">
              Consulte dados operacionais e financeiros com rastreabilidade até a diligência e o processo de origem.
            </p>
          </div>


          <Link
            href={`/protected/relatorios/exportar?${paramsExportacao.toString()}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />

            Exportar Excel
          </Link>

        </div>
      </section>


      {/* =================================================
          FILTROS
      ================================================== */}

      <section className="mb-6 rounded-xl border bg-card p-5">

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <h2 className="font-semibold">
            Configurar relatório
          </h2>
        </div>


        <form
          method="get"
          className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >

          <label className="space-y-1.5">
            <span className="text-sm font-medium">
              Relatório
            </span>

            <select
              name="tipo"
              defaultValue={
                filtros.tipo
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              {Object.entries(
                NOMES_RELATORIOS
              ).map(
                (
                  [
                    valor,
                    nome,
                  ]
                ) => (
                  <option
                    key={
                      valor
                    }
                    value={
                      valor
                    }
                  >
                    {nome}
                  </option>
                )
              )}
            </select>
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-medium">
              Período inicial
            </span>

            <input
              type="date"
              name="inicio"
              defaultValue={
                filtros.inicio
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-medium">
              Período final
            </span>

            <input
              type="date"
              name="fim"
              defaultValue={
                filtros.fim
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-medium">
              Tipo de diligência
            </span>

            <select
              name="tipo_diligencia"
              defaultValue={
                filtros
                  .tipoDiligencia
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">
                Todos
              </option>

              {resultado
                .opcoes
                .tiposDiligencia
                .map(
                  (
                    item
                  ) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {item}
                    </option>
                  )
                )}
            </select>
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-medium">
              UF
            </span>

            <select
              name="uf"
              defaultValue={
                filtros.uf
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">
                Todas
              </option>

              {resultado
                .opcoes
                .ufs
                .map(
                  (
                    uf
                  ) => (
                    <option
                      key={
                        uf
                      }
                      value={
                        uf
                      }
                    >
                      {uf}
                    </option>
                  )
                )}
            </select>
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-medium">
              Profissional
            </span>

            <select
              name="profissional"
              defaultValue={
                filtros
                  .profissionalId
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">
                Todos
              </option>

              {resultado
                .opcoes
                .profissionais
                .map(
                  (
                    profissional
                  ) => (
                    <option
                      key={
                        profissional.id
                      }
                      value={
                        profissional.id
                      }
                    >
                      {profissional.nome}
                    </option>
                  )
                )}
            </select>
          </label>


          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0b1f3a] px-4 text-sm font-medium text-white hover:opacity-90"
            >
              Gerar relatório
            </button>


            <Link
              href="/protected/relatorios"
              className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            >
              Limpar filtros
            </Link>

          </div>
        </form>


        <p className="mt-4 text-xs text-muted-foreground">
          Critério do período:{" "}
          <strong>
            {
              resultado
                .criterioPeriodo
            }
          </strong>
          .
        </p>

      </section>


      {/* =================================================
          RESUMO
      ================================================== */}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Registros encontrados
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              resultado
                .quantidade
            }
          </p>
        </div>


        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Diligências envolvidas
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              resultado
                .diligenciasUnicas
            }
          </p>
        </div>


        {financeiro && (
          <div className="rounded-xl border bg-card p-5">

            <p className="text-sm text-muted-foreground">
              Valor total
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatarMoeda(
                resultado
                  .valorTotal
              )}
            </p>

          </div>
        )}

      </section>


      {/* =================================================
          RESULTADOS
      ================================================== */}

      <section className="overflow-hidden rounded-xl border bg-card">

        <div className="border-b px-6 py-5">

          <div className="flex items-center gap-2">

            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              {
                resultado.nome
              }
            </h2>

          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            A visualização mostra até {LIMITE_TELA} registros. O Excel exporta todos os resultados.
          </p>

        </div>


        {resultado
          .quantidade ===
          0 ? (

          <div className="flex min-h-64 items-center justify-center px-6 text-center">

            <p className="text-sm text-muted-foreground">
              Nenhum registro encontrado para os filtros selecionados.
            </p>

          </div>

        ) : financeiro ? (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-sm">

              <thead className="bg-muted/50 text-left">

                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Processo
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Partes
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Diligência
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Profissional
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Valor
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Data
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Situação
                  </th>
                </tr>

              </thead>


              <tbody className="divide-y">

                {resultado
                  .linhasFinanceiras
                  .slice(
                    0,
                    LIMITE_TELA
                  )
                  .map(
                    (
                      linha
                    ) => (

                      <tr
                        key={
                          linha
                            .contratacao
                            .id
                        }
                        className="align-top"
                      >

                        <td className="px-4 py-4 font-mono text-xs">
                          {formatarProcesso(
                            linha
                              .diligencia
                              .numero_processo
                          )}
                        </td>


                        <td className="px-4 py-4">
                          <p className="font-medium">
                            {linha
                              .diligencia
                              .parte_autora ||
                              "—"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            x{" "}
                            {linha
                              .diligencia
                              .parte_re ||
                              "—"}
                          </p>
                        </td>


                        <td className="px-4 py-4">
                          <p className="font-medium">
                            {linha
                              .diligencia
                              .tipo_diligencia}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatarData(
                              linha
                                .diligencia
                                .data_diligencia
                            )}
                          </p>
                        </td>


                        <td className="px-4 py-4">
                          <p className="font-medium">
                            {linha
                              .profissional
                              ?.nome ||
                              "Não localizado"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {linha
                              .contratacao
                              .tipo_profissional ===
                              "advogado"
                              ? "Advogado"
                              : "Preposto"}
                          </p>
                        </td>


                        <td className="px-4 py-4 font-semibold">
                          {formatarMoeda(
                            Number(
                              linha
                                .contratacao
                                .valor
                            ) ||
                              0
                          )}
                        </td>


                        <td className="px-4 py-4">
                          {filtros.tipo ===
                            "pagamentos_realizados"
                            ? formatarData(
                                linha
                                  .contratacao
                                  .pago_em
                              )
                            : formatarData(
                                linha
                                  .contratacao
                                  .pagamento_combinado_em
                              )}
                        </td>


                        <td className="px-4 py-4">
                          {linha
                            .contratacao
                            .pago_em
                            ? "Pago"
                            : "Pendente"}
                        </td>

                      </tr>
                    )
                  )}

              </tbody>
            </table>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px] text-sm">

              <thead className="bg-muted/50 text-left">

                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Processo
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Partes
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Tipo
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Data
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Vara / comarca
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Resultado
                  </th>
                </tr>

              </thead>


              <tbody className="divide-y">

                {resultado
                  .diligencias
                  .slice(
                    0,
                    LIMITE_TELA
                  )
                  .map(
                    (
                      diligencia
                    ) => (

                      <tr
                        key={
                          diligencia.id
                        }
                        className="align-top"
                      >

                        <td className="px-4 py-4 font-mono text-xs">
                          {formatarProcesso(
                            diligencia
                              .numero_processo
                          )}
                        </td>


                        <td className="px-4 py-4">
                          <p className="font-medium">
                            {diligencia
                              .parte_autora ||
                              "—"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            x{" "}
                            {diligencia
                              .parte_re ||
                              "—"}
                          </p>
                        </td>


                        <td className="px-4 py-4">
                          {
                            diligencia
                              .tipo_diligencia
                          }
                        </td>


                        <td className="px-4 py-4">
                          {formatarData(
                            diligencia
                              .data_diligencia
                          )}

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              diligencia
                                .horario
                                ?.slice(
                                  0,
                                  5
                                )
                            }
                          </p>
                        </td>


                        <td className="px-4 py-4">
                          {diligencia
                            .vara ||
                            "—"}

                          <p className="mt-1 text-xs text-muted-foreground">
                            {diligencia
                              .comarca ||
                              "—"}

                            {diligencia.uf
                              ? `/${diligencia.uf}`
                              : ""}
                          </p>
                        </td>


                        <td className="px-4 py-4">
                          {textoResultado(
                            diligencia
                              .resultado_diligencia
                          )}
                        </td>

                      </tr>
                    )
                  )}

              </tbody>
            </table>

          </div>
        )}

      </section>

    </main>
  );
}