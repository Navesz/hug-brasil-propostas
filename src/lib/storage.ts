import {
  isLogoReference,
  isCroquiReference,
  loadLogo,
  loadCroqui,
  LOGO_REF_PREFIX,
  CROQUI_REF_PREFIX,
  saveLogo,
  saveCroqui,
} from "@/lib/logoStorage";
import type { KitSistema, PropostaSalva, PropostaSolar } from "@/types/proposal";

const STORAGE_KEY = "hug-brasil-propostas";
const DRAFT_KEY = "hug-brasil-rascunho-atual";
const ORCAMENTO_SEQ_KEY = "hug-brasil-orcamento-seq";
const ORCAMENTO_REGISTRO_KEY = "hug-brasil-orcamentos-registro";

/** Primeiro orçamento gerado será 00500. */
export const ORCAMENTO_NUMERO_INICIO = 500;
export const ORCAMENTO_NUMERO_DIGITOS = 5;

export interface RegistroOrcamento {
  numero: string;
  propostaId: string;
  cliente: string;
  dataProposta: string;
  createdAt: string;
}

export interface SalvarRascunhoResult {
  ok: boolean;
  logoPersisted: boolean;
  warning?: string;
}

export function formatarNumeroOrcamento(seq: number): string {
  return String(seq).padStart(ORCAMENTO_NUMERO_DIGITOS, "0");
}

function lerSequenciaOrcamento(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(ORCAMENTO_SEQ_KEY) || "0", 10) || 0;
}

function salvarSequenciaOrcamento(seq: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORCAMENTO_SEQ_KEY, String(seq));
}

export function sincronizarSequenciaOrcamento(numero: string): void {
  const n = parseInt(numero.replace(/\D/g, ""), 10);
  if (!Number.isNaN(n) && n > lerSequenciaOrcamento()) {
    salvarSequenciaOrcamento(n);
  }
}

export function gerarProximoNumeroOrcamento(): string {
  const next = lerSequenciaOrcamento() + 1;
  salvarSequenciaOrcamento(next);
  return formatarNumeroOrcamento(next);
}

export function listarRegistroOrcamentos(): RegistroOrcamento[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORCAMENTO_REGISTRO_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RegistroOrcamento[];
  } catch {
    return [];
  }
}

export function registrarOrcamento(data: PropostaSolar): void {
  if (typeof window === "undefined" || !data.numeroOrcamento) return;

  sincronizarSequenciaOrcamento(data.numeroOrcamento);

  const list = listarRegistroOrcamentos().filter(
    (r) => r.numero !== data.numeroOrcamento
  );
  list.unshift({
    numero: data.numeroOrcamento,
    propostaId: data.id,
    cliente: data.nomeCliente,
    dataProposta: data.dataProposta,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(
    ORCAMENTO_REGISTRO_KEY,
    JSON.stringify(list.slice(0, 500))
  );
}

function isDataUrlImage(url: string | undefined): boolean {
  return Boolean(url?.startsWith("data:image/"));
}

async function persistKitsCroquis(kits: KitSistema[]): Promise<KitSistema[]> {
  return Promise.all(
    kits.map(async (kit) => {
      if (!kit.croquiAtivo || !isDataUrlImage(kit.croquiUrl)) return kit;
      try {
        const ref = await saveCroqui(kit.id, kit.croquiUrl);
        return { ...kit, croquiUrl: ref };
      } catch {
        return { ...kit, croquiUrl: `${CROQUI_REF_PREFIX}${kit.id}` };
      }
    })
  );
}

function stripKitsCroquis(kits: KitSistema[]): KitSistema[] {
  return kits.map((kit) => ({
    ...kit,
    croquiUrl: isDataUrlImage(kit.croquiUrl)
      ? `${CROQUI_REF_PREFIX}${kit.id}`
      : kit.croquiUrl,
  }));
}

async function resolveKitsCroquis(kits: KitSistema[]): Promise<KitSistema[]> {
  return Promise.all(
    kits.map(async (kit) => {
      if (!isCroquiReference(kit.croquiUrl)) return kit;
      const url = await loadCroqui(kit.croquiUrl);
      return url ? { ...kit, croquiUrl: url } : { ...kit, croquiUrl: "" };
    })
  );
}

async function resolvePropostaImagens(data: PropostaSolar): Promise<PropostaSolar> {
  let next = { ...data };
  if (isLogoReference(next.logoUrl)) {
    const logo = await loadLogo(next.logoUrl);
    if (logo) next = { ...next, logoUrl: logo };
  }
  next = { ...next, kits: await resolveKitsCroquis(next.kits) };
  return next;
}

function isDataUrlLogo(url: string | undefined): boolean {
  return isDataUrlImage(url);
}

async function persistPropostaImagens(data: PropostaSolar): Promise<PropostaSolar> {
  let next = data;
  if (isDataUrlLogo(data.logoUrl)) {
    next = await persistLogoIfNeeded(data);
  }
  next = { ...next, kits: await persistKitsCroquis(next.kits) };
  return next;
}

async function persistLogoIfNeeded(data: PropostaSolar): Promise<PropostaSolar> {
  if (!isDataUrlLogo(data.logoUrl)) return data;

  const ref = await saveLogo(data.id, data.logoUrl);
  return { ...data, logoUrl: ref };
}

function stripLogoForStorage(data: PropostaSolar): PropostaSolar {
  if (isDataUrlLogo(data.logoUrl)) {
    return { ...data, logoUrl: `${LOGO_REF_PREFIX}${data.id}` };
  }
  return data;
}

function stripPropostaParaStorage(data: PropostaSolar): PropostaSolar {
  return {
    ...stripLogoForStorage(data),
    kits: stripKitsCroquis(data.kits),
  };
}

function trySetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw err;
    }
    throw err;
  }
}

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

export async function salvarProposta(
  data: PropostaSolar,
  nome?: string
): Promise<PropostaSalva> {
  let persisted = data;
  try {
    persisted = await persistPropostaImagens(data);
  } catch {
    // Imagens permanecem só em memória se IndexedDB falhar
  }

  const list = listarPropostas();
  const now = new Date().toISOString();
  const entry: PropostaSalva = {
    id: data.id || crypto.randomUUID(),
    nome:
      nome ||
      `${data.nomeCliente || "Sem cliente"} — Orç. ${data.numeroOrcamento || "sem nº"}`,
    cliente: data.nomeCliente,
    numeroOrcamento: data.numeroOrcamento,
    updatedAt: now,
    data: {
      ...stripPropostaParaStorage(persisted),
      id: data.id || crypto.randomUUID(),
    },
  };

  const idx = list.findIndex((p) => p.id === entry.id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);

  trySetItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  registrarOrcamento(entry.data);

  return {
    ...entry,
    data: await resolvePropostaImagens({
      ...entry.data,
      logoUrl: isDataUrlLogo(data.logoUrl) ? data.logoUrl : entry.data.logoUrl,
      kits: data.kits.map((k, i) => ({
        ...entry.data.kits[i],
        croquiUrl: isDataUrlImage(k.croquiUrl) ? k.croquiUrl : entry.data.kits[i]?.croquiUrl ?? "",
      })),
    }),
  };
}

export async function carregarProposta(id: string): Promise<PropostaSolar | null> {
  const found = listarPropostas().find((p) => p.id === id);
  if (!found) return null;

  return resolvePropostaImagens({ ...found.data });
}

export function excluirProposta(id: string): void {
  const list = listarPropostas().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function salvarRascunho(data: PropostaSolar): Promise<SalvarRascunhoResult> {
  if (typeof window === "undefined") {
    return { ok: true, logoPersisted: false };
  }

  let logoPersisted = false;
  let payload = data;

  try {
    if (isDataUrlLogo(data.logoUrl) || data.kits.some((k) => k.croquiAtivo && isDataUrlImage(k.croquiUrl))) {
      payload = await persistPropostaImagens(data);
      logoPersisted = true;
    }
  } catch {
    payload = stripPropostaParaStorage(data);
  }

  const toStore = stripPropostaParaStorage(payload);

  try {
    trySetItem(DRAFT_KEY, JSON.stringify(toStore));
    return { ok: true, logoPersisted };
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      try {
        const withoutLogo = { ...toStore, logoUrl: "" };
        trySetItem(DRAFT_KEY, JSON.stringify(withoutLogo));
        return {
          ok: true,
          logoPersisted,
          warning:
            "Rascunho salvo sem logo (limite de armazenamento). A logo permanece nesta sessão.",
        };
      } catch {
        return {
          ok: false,
          logoPersisted: false,
          warning: "Não foi possível salvar o rascunho: armazenamento local cheio.",
        };
      }
    }
    return {
      ok: false,
      logoPersisted: false,
      warning: "Erro ao salvar rascunho.",
    };
  }
}

export async function carregarRascunho(): Promise<PropostaSolar | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PropostaSolar;
    return resolvePropostaImagens(data);
  } catch {
    return null;
  }
}

export function limparRascunho(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export function inicializarSequenciaOrcamentos(): void {
  if (typeof window === "undefined") return;
  const propostas = listarPropostas();
  const registro = listarRegistroOrcamentos();
  const numeros = [
    ...propostas.map((p) => p.numeroOrcamento),
    ...registro.map((r) => r.numero),
  ].filter(Boolean);
  numeros.forEach((n) => sincronizarSequenciaOrcamento(n));

  const atual = lerSequenciaOrcamento();
  const minimo = ORCAMENTO_NUMERO_INICIO - 1;
  if (atual < minimo) {
    salvarSequenciaOrcamento(minimo);
  }
}
