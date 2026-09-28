export function normalizarNumeroProcesso(
  processo: string
) {
  return processo.replace(/\D/g, "");
}

export function formatarNumeroProcesso(
  processo: string | null | undefined
) {
  if (!processo) {
    return "";
  }

  const numeros = processo.replace(/\D/g, "");

  if (numeros.length !== 20) {
    return processo;
  }

  return (
    `${numeros.slice(0, 7)}-` +
    `${numeros.slice(7, 9)}.` +
    `${numeros.slice(9, 13)}.` +
    `${numeros.slice(13, 14)}.` +
    `${numeros.slice(14, 16)}.` +
    `${numeros.slice(16, 20)}`
  );
}