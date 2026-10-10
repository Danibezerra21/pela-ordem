import {
  obterContextoAcesso,
  temPermissao,
} from "@/lib/permissoes";

export default async function DebugAcessoPage() {

  const contexto =
    await obterContextoAcesso();

  const podeVisualizarDiligencias =
    await temPermissao(
      "diligencias.visualizar"
    );

  const podeCriarDiligencias =
    await temPermissao(
      "diligencias.criar"
    );

  const podeFinanceiro =
    await temPermissao(
      "financeiro.visualizar"
    );

  const podeRelatorios =
    await temPermissao(
      "relatorios.visualizar"
    );

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Diagnóstico de acesso
      </h1>

      <pre className="mt-6 overflow-auto rounded-xl border bg-muted p-5 text-sm">
        {JSON.stringify(
          {
            usuarioId:
              contexto.usuarioId,

            empresaId:
              contexto.empresaId,

            papel:
              contexto.papel,

            nucleo:
              contexto.nucleo,

            tipoAcesso:
              contexto.tipoAcesso,

            permissoes: {
              diligenciasVisualizar:
                podeVisualizarDiligencias,

              diligenciasCriar:
                podeCriarDiligencias,

              financeiroVisualizar:
                podeFinanceiro,

              relatoriosVisualizar:
                podeRelatorios,
            },
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}