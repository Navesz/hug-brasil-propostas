import type { PropostaSalva, PropostaSolar } from "@/types/proposal";

const STORAGE_KEY = "hug-brasil-propostas";
const DRAFT_KEY = "hug-brasil-rascunho-atual";

export function listarPropostas(): PropostaSalva[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as PropostaSalva[];
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function salvarProposta(data: PropostaSolar, nome?: string): PropostaSalva {
  const list = listarPropostas();
  const now = new Date().toISOString();
  const entry: PropostaSalva = {
    id: data.id || crypto.randomUUID(),
    nome:
      nome ||
      `${data.nomeCliente || "Sem cliente"} — ${data.numeroOrcamento || "sem nº"}`,
    cliente: data.nomeCliente,
    numeroOrcamento: data.numeroOrcamento,
    updatedAt: now,
    data: { ...data, id: data.id || crypto.randomUUID() },
  };

  const idx = list.findIndex((p) => p.id === entry.id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  return entry;
}

export function carregarProposta(id: string): PropostaSolar | null {
  const found = listarPropostas().find((p) => p.id === id);
  return found ? { ...found.data } : null;
}

export function excluirProposta(id: string): void {
  const list = listarPropostas().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function salvarRascunho(data: PropostaSolar): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

export function carregarRascunho(): PropostaSolar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PropostaSolar) : null;
  } catch {
    return null;
  }
}

export function limparRascunho(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
