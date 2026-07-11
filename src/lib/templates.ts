import type { PropostaSolar } from "@/types/proposal";
import {
  createDefaultProposal,
  createEmptyKit,
  createNewId,
  calcularValidadeProposta,
} from "./defaultProposal";
import { aplicarCalculos } from "./calculations";
import { gerarProximoNumeroOrcamento } from "./storage";

const MODELOS_KEY = "hug-brasil-modelos";

export interface ModeloProposta {
  id: string;
  nome: string;
  criadoEm: string;
  data: Partial<PropostaSolar>;
}

function extrairDadosModelo(source: PropostaSolar): Partial<PropostaSolar> {
  const {
    id: _id,
    numeroOrcamento: _num,
    nomeCliente: _cliente,
    enderecoInstalacao: _end,
    dataProposta: _data,
    validadeProposta: _val,
    logoUrl: _logo,
    ...resto
  } = source;

  return {
    ...resto,
    kits: source.kits.map((k) => ({
      ...k,
      croquiAtivo: false,
      croquiUrl: "",
    })),
  };
}

export function listarModelos(): ModeloProposta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MODELOS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ModeloProposta[];
  } catch {
    return [];
  }
}

export function salvarModelo(nome: string, source: PropostaSolar): ModeloProposta {
  const modelo: ModeloProposta = {
    id: createNewId(),
    nome: nome.trim() || "Modelo sem nome",
    criadoEm: new Date().toISOString(),
    data: extrairDadosModelo(source),
  };
  const lista = [modelo, ...listarModelos()].slice(0, 50);
  localStorage.setItem(MODELOS_KEY, JSON.stringify(lista));
  return modelo;
}

export function excluirModelo(id: string): void {
  const lista = listarModelos().filter((m) => m.id !== id);
  localStorage.setItem(MODELOS_KEY, JSON.stringify(lista));
}

export function aplicarModelo(modeloId: string): PropostaSolar {
  const base = createDefaultProposal(true);
  const modelo = listarModelos().find((m) => m.id === modeloId);
  if (!modelo) return base;

  return aplicarCalculos({
    ...base,
    ...modelo.data,
    kits:
      modelo.data.kits?.map((k, i) => ({
        ...createEmptyKit(k.titulo || `Kit ${i + 1}`),
        ...k,
        id: createNewId(),
        croquiAtivo: false,
        croquiUrl: "",
      })) ?? base.kits,
  });
}

/** @deprecated use aplicarModelo */
export function aplicarTemplate(templateId: string): PropostaSolar {
  return aplicarModelo(templateId);
}

export function duplicarProposta(data: PropostaSolar): PropostaSolar {
  const dataProposta = new Date().toLocaleDateString("pt-BR");
  return {
    ...data,
    id: createNewId(),
    numeroOrcamento:
      typeof window !== "undefined" ? gerarProximoNumeroOrcamento() : "",
    nomeCliente: data.nomeCliente ? `${data.nomeCliente} (cópia)` : "",
    dataProposta,
    validadeProposta: calcularValidadeProposta(dataProposta),
    kits: data.kits.map((k) => ({
      ...k,
      id: createNewId(),
      croquiUrl: k.croquiUrl,
    })),
  };
}
