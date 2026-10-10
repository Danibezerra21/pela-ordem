import "server-only";

function getAsaasConfig() {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL;

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada.");
  }

  if (!baseUrl) {
    throw new Error("ASAAS_BASE_URL não configurada.");
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}

export async function asaasRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { apiKey, baseUrl } = getAsaasConfig();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "User-Agent": "NOTE-LITIS/1.0",
      access_token: apiKey,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Erro Asaas ${response.status}: ${body.slice(0, 500)}`,
    );
  }

  return response.json() as Promise<T>;
}