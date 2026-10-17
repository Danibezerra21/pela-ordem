"use client";

import {
  Download,
} from "lucide-react";

import * as XLSX from "xlsx";

export type ClienteExportacao = {
  cliente: string;

  cadastradaEm:
    | string
    | null;

  diasDesdeCadastro:
    number;

  statusAcesso:
    | string
    | null;

  statusComercial:
    | string
    | null;

  usuariosAtivos:
    number;

  usuariosCadastrados:
    number;

  diligenciasTotal:
    number;

  diligenciasUltimos30Dias:
    number;

  diasAtivosUltimos30Dias:
    number;

  ativaUltimos7Dias:
    boolean;

  ativaUltimos30Dias:
    boolean;

  ultimaAtividade:
    | string
    | null;

  acessoPagoAte:
    | string
    | null;

  pagamentosConfirmados:
    number;

  valorTotalPago:
    number;

  pagamentosAguardandoConfirmacao:
    number;

  pagamentosNaoLocalizados:
    number;

  ultimoPagamentoConfirmado:
    | string
    | null;
};

type ExportarClientesProps = {
  clientes:
    ClienteExportacao[];
};

function converterData(
  valor:
    | string
    | null
) {
  if (!valor) {
    return null;
  }

  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data;
}

function hojeEmRecife() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Recife",
      year:
        "numeric",
      month:
        "2-digit",
      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}

export function ExportarClientes({
  clientes,
}: ExportarClientesProps) {
  function exportar() {
    if (
      clientes.length ===
      0
    ) {
      return;
    }

    const linhas =
      clientes.map(
        (
          cliente
        ) => ({
          "Cliente":
            cliente.cliente,

          "Data de cadastro":
            converterData(
              cliente.cadastradaEm
            ),

          "Dias desde o cadastro":
            cliente.diasDesdeCadastro,

          "Status de acesso":
            cliente.statusAcesso ??
            "",

          "Status comercial":
            cliente.statusComercial ??
            "",

          "Usuários ativos":
            cliente.usuariosAtivos,

          "Usuários cadastrados":
            cliente.usuariosCadastrados,

          "Diligências total":
            cliente.diligenciasTotal,

          "Diligências últimos 30 dias":
            cliente
              .diligenciasUltimos30Dias,

          "Dias ativos últimos 30 dias":
            cliente
              .diasAtivosUltimos30Dias,

          "Atividade últimos 7 dias":
            cliente
              .ativaUltimos7Dias
              ? "Sim"
              : "Não",

          "Atividade últimos 30 dias":
            cliente
              .ativaUltimos30Dias
              ? "Sim"
              : "Não",

          "Última atividade":
            converterData(
              cliente.ultimaAtividade
            ),

          "Acesso pago até":
            converterData(
              cliente.acessoPagoAte
            ),

          "Pagamentos confirmados":
            cliente
              .pagamentosConfirmados,

          "Valor total pago":
            cliente
              .valorTotalPago,

          "Pagamentos aguardando confirmação":
            cliente
              .pagamentosAguardandoConfirmacao,

          "Pagamentos não localizados":
            cliente
              .pagamentosNaoLocalizados,

          "Último pagamento confirmado":
            converterData(
              cliente
                .ultimoPagamentoConfirmado
            ),
        })
      );

    const planilha =
      XLSX.utils.json_to_sheet(
        linhas,
        {
          cellDates:
            true,

          dateNF:
            "dd/mm/yyyy",
        }
      );

    planilha[
      "!cols"
    ] = [
      { wch: 34 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 21 },
      { wch: 18 },
      { wch: 28 },
      { wch: 27 },
      { wch: 24 },
      { wch: 25 },
      { wch: 22 },
      { wch: 18 },
      { wch: 23 },
      { wch: 18 },
      { wch: 34 },
      { wch: 28 },
      { wch: 28 },
    ];

    if (
      planilha["!ref"]
    ) {
      planilha[
        "!autofilter"
      ] = {
        ref:
          planilha["!ref"],
      };
    }

    const quantidadeLinhas =
      linhas.length;

    for (
      let linha = 2;
      linha <=
      quantidadeLinhas +
        1;
      linha += 1
    ) {
      const cadastro =
        planilha[
          `B${linha}`
        ];

      if (
        cadastro
      ) {
        cadastro.z =
          "dd/mm/yyyy";
      }

      const ultimaAtividade =
        planilha[
          `M${linha}`
        ];

      if (
        ultimaAtividade
      ) {
        ultimaAtividade.z =
          "dd/mm/yyyy hh:mm";
      }

      const acessoPagoAte =
        planilha[
          `N${linha}`
        ];

      if (
        acessoPagoAte
      ) {
        acessoPagoAte.z =
          "dd/mm/yyyy";
      }

      const valorTotalPago =
        planilha[
          `P${linha}`
        ];

      if (
        valorTotalPago
      ) {
        valorTotalPago.z =
          '"R$" #,##0.00';
      }

      const ultimoPagamento =
        planilha[
          `S${linha}`
        ];

      if (
        ultimoPagamento
      ) {
        ultimoPagamento.z =
          "dd/mm/yyyy hh:mm";
      }
    }

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      planilha,
      "CLIENTES"
    );

    workbook.Props = {
      Title:
        "Clientes - NOTE LITIS",

      Subject:
        "Base de clientes, utilização e pagamentos",

      Author:
        "NOTE LITIS",

      Company:
        "Encontre Correspondente",
    };

    XLSX.writeFile(
      workbook,
      `NOTE_LITIS_clientes_${hojeEmRecife()}.xlsx`,
      {
        compression:
          true,
      }
    );
  }

  return (
    <button
      type="button"
      onClick={
        exportar
      }
      disabled={
        clientes.length ===
        0
      }
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" />

      Exportar clientes (.xlsx)
    </button>
  );
}
