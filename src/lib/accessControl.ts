export type AccessConfig = {
  enabled: boolean;
  message?: string;
};

const ACCESS_CONFIG_URL =
  process.env.NEXT_PUBLIC_ACCESS_CONFIG_URL ??
  "https://raw.githubusercontent.com/Navesz/hug-brasil-propostas/main/config/access.json";

const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

export async function fetchAccessConfig(): Promise<AccessConfig> {
  const response = await fetch(ACCESS_CONFIG_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error("Não foi possível verificar o acesso.");
  }

  const data = (await response.json()) as AccessConfig;

  if (typeof data.enabled !== "boolean") {
    throw new Error("Resposta de acesso inválida.");
  }

  return data;
}

export { ACCESS_CONFIG_URL, RECHECK_INTERVAL_MS };
