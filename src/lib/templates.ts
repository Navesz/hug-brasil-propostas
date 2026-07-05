import type { PropostaSolar } from "@/types/proposal";
import { createDefaultProposal, createEmptyKit } from "./defaultProposal";

export interface TemplateProposta {
  id: string;
  nome: string;
  descricao: string;
  data: Partial<PropostaSolar>;
}

export const TEMPLATES: TemplateProposta[] = [
  {
    id: "residencial-on-grid",
    nome: "Residencial On-Grid",
    descricao: "Casa ou apartamento conectado à rede",
    data: {
      tipoSistema: "on-grid",
      tipoRede: "residencial",
      tipoLigacao: "monofasico",
      tensaoRede: "220V",
      consumoMedio12Meses: "500",
      reducaoConta: "96",
      percentualGeracao: "100",
      kits: [
        {
          ...createEmptyKit("Kit Residencial"),
          potenciaKwp: "4,27",
          quantidadePlacas: "7",
          potenciaPlacaW: "610",
          modeloPlacas: "MÓDULO 610W PU MONOFACIAL",
          quantidadeInversores: "1",
          modeloInversor: "SOLIS S6-GR1P3K-M",
          investimento: "15000",
        },
      ],
      investimentoTotal: "15.000,00",
      certificacaoInmetro: "Classe A",
    },
  },
  {
    id: "comercial-on-grid",
    nome: "Comercial On-Grid",
    descricao: "Empresa ou comércio conectado à rede",
    data: {
      tipoSistema: "on-grid",
      tipoRede: "comercial",
      tipoLigacao: "trifasico",
      tensaoRede: "380V",
      consumoMedio12Meses: "3000",
      reducaoConta: "90",
      kits: [
        {
          ...createEmptyKit("Kit Comercial"),
          potenciaKwp: "30",
          quantidadePlacas: "50",
          potenciaPlacaW: "600",
          modeloPlacas: "JA SOLAR 600W",
          quantidadeInversores: "1",
          modeloInversor: "SOLIS 30kW",
        },
      ],
      certificacaoInmetro: "Classe A",
    },
  },
  {
    id: "hibrido-clinica",
    nome: "Híbrido — Clínica / Comercial",
    descricao: "Sistema híbrido com backup (modelo Dr. Antonio)",
    data: {
      tipoSistema: "hibrido",
      tipoRede: "comercial",
      tipoLigacao: "trifasico",
      tensaoRede: "220V",
      consumoMedio12Meses: "5900",
      reducaoConta: "95",
      descricaoProjeto:
        "A solução proposta foi desenvolvida para proporcionar redução dos custos com energia elétrica, maior previsibilidade financeira e continuidade operacional em situações de interrupção do fornecimento da concessionária.",
      kits: [
        {
          ...createEmptyKit("Kit Fotovoltaico Clínicas"),
          potenciaKwp: "53,50",
          quantidadePlacas: "87",
          potenciaPlacaW: "615",
          modeloPlacas: "JA SOLAR 615W BIFACIAL N-TYPE",
          quantidadeInversores: "2",
          modeloInversorHibrido: "FOXESS 7.5 kW 220V",
          modeloInversorOngrid: "SOLIS 30 kW 220V",
          bateria: "2 x 5.2 kWh FoxESS",
          geracaoMediaMensal: "5900",
          economiaMediaMensal: "7375",
          investimento: "157800",
        },
      ],
      notaTecnicaModulo:
        "Módulos JA Solar 615W Bifacial N-Type: Classificação AAA na Pirâmide de Bancabilidade, demonstrando elevada solidez financeira e ampla aceitação pelos principais investidores e instituições financeiras do mercado.",
      investimentoTotal: "157.800,00",
      certificacaoInmetro: "Classe A",
    },
  },
  {
    id: "off-grid-rural",
    nome: "Off-Grid Rural",
    descricao: "Sistema isolado com baterias",
    data: {
      tipoSistema: "off-grid",
      tipoRede: "rural",
      tipoLigacao: "monofasico",
      tensaoRede: "220V",
      consumoMedio12Meses: "800",
      kits: [
        {
          ...createEmptyKit("Kit Off-Grid"),
          potenciaKwp: "8",
          quantidadePlacas: "14",
          potenciaPlacaW: "580",
          modeloPlacas: "JA SOLAR 580W",
          quantidadeInversores: "1",
          modeloInversor: "Inversor Off-Grid 5kW",
          bateria: "4 x 5.2 kWh",
        },
      ],
      certificacaoInmetro: "Classe A",
    },
  },
];

export function aplicarTemplate(templateId: string): PropostaSolar {
  const base = createDefaultProposal();
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return base;

  return {
    ...base,
    ...template.data,
    id: crypto.randomUUID(),
    kits: template.data.kits?.map((k) => ({
      ...createEmptyKit(),
      ...k,
      id: crypto.randomUUID(),
    })) ?? base.kits,
  };
}

export function duplicarProposta(data: PropostaSolar): PropostaSolar {
  return {
    ...data,
    id: crypto.randomUUID(),
    numeroOrcamento: "",
    nomeCliente: data.nomeCliente ? `${data.nomeCliente} (cópia)` : "",
    dataProposta: new Date().toLocaleDateString("pt-BR"),
    validadeProposta: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString("pt-BR"),
    kits: data.kits.map((k) => ({ ...k, id: crypto.randomUUID() })),
  };
}
