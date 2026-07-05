import type { KitSistema, PropostaSolar } from "@/types/proposal";
import { DEFAULT_LOGO } from "@/lib/constants";

export function createEmptyKit(titulo = "Kit Fotovoltaico Principal"): KitSistema {
  return {
    id: crypto.randomUUID(),
    titulo,
    descricao: "",
    potenciaKwp: "",
    quantidadePlacas: "",
    potenciaPlacaW: "",
    modeloPlacas: "",
    garantiaPlacas: "25 anos",
    quantidadeInversores: "",
    modeloInversor: "",
    garantiaInversor: "10 anos",
    modeloInversorHibrido: "",
    garantiaInversorHibrido: "10 anos",
    modeloInversorOngrid: "",
    garantiaInversorOngrid: "5 anos",
    bateria: "",
    garantiaBateriaCiclos: "≥ 6.000",
    garantiaBateriaAnos: "5 anos",
    geracaoMediaMensal: "",
    economiaMediaMensal: "",
    estruturas: "Estruturas inclusas",
    acessorios: "Acessórios inclusos",
    investimento: "",
  };
}

function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function createEmptyConsumoMensal(): string[] {
  return Array(12).fill("");
}

export function createDefaultProposal(): PropostaSolar {
  const hoje = new Date();
  return {
    id: crypto.randomUUID(),
    logoUrl: DEFAULT_LOGO,
    numeroOrcamento: "",
    dataProposta: formatDateBR(hoje),
    validadeProposta: formatDateBR(addDays(hoje, 30)),

    nomeCliente: "",
    unidades: "",
    enderecoInstalacao: "",

    tipoSistema: "on-grid",
    tipoLigacao: "trifasico",
    tipoRede: "residencial",
    tensaoRede: "380V",
    concessionaria: "",
    consumoMedio12Meses: "",
    consumoMensalDetalhado: createEmptyConsumoMensal(),
    usarConsumoDetalhado: false,
    reducaoConta: "",
    valorKwh: "0,65",
    perdasSistema: "20",
    fatorGeracaoKwp: "1600",
    percentualGeracao: "100",
    simultaneidade: "0",
    considerarTusdG: false,
    irradiacaoLocal: "",

    kits: [createEmptyKit()],

    geracaoAnual: "",
    percentualCobertura: "",

    investimentoTotal: "",
    investimentoMateriais: "",
    investimentoServicos: "",
    custoPorWp: "",
    payback: "",
    aumentoAnualEnergia: "5",
    perdaPotenciaAnual: "0,8",

    garantiaModulo: "15 anos",
    garantiaInversorServico: "10 anos",
    garantiaServicos: "12 meses",
    certificacaoInmetro: "Classe A",
    notaTecnicaModulo: "",

    formasPagamento: {
      transferencia: true,
      cartao: true,
      boleto: true,
      financiamento: true,
      pix: true,
    },

    ocultarValores: false,

    observacoes: "",
    observacoesFinanciamento:
      "As condições de financiamento estão em fase de análise. Estamos avaliando as melhores taxas e prazos disponíveis no mercado.",
    descricaoProjeto:
      "A solução proposta foi desenvolvida para proporcionar redução dos custos com energia elétrica, maior previsibilidade financeira e continuidade operacional.",

    empresaNome: "HUG BRASIL ENERGIA SOLAR",
    empresaCnpj: "31.477.529/0001-24",
    empresaContato: "Renata Sampaio – Gerente Comercial (21) 96999-5464",
    empresaEndereco:
      "Av. das Américas 297, sala 216 – Barra da Tijuca – Rio de Janeiro/RJ 22.631-000",
    empresaSite: "www.hugbrasil.com",
    representanteNome: "THIAGO CUPERTINO C FELIPE INSTALADORA",
    representanteCnpj: "31.477.529/0001-24",
  };
}
