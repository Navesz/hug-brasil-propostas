import type { KitSistema, PropostaSolar } from "@/types/proposal";
import { DEFAULT_LOGO } from "@/lib/constants";
import { calcularValidadeProposta } from "@/lib/defaultProposal";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const FATORES_SAZONAIS = [1.12, 1.1, 1.05, 0.95, 0.88, 0.82, 0.83, 0.9, 0.98, 1.05, 1.1, 1.12];

/** Sazonalidade típica de consumo residencial/comercial no Brasil (pico no verão). */
const FATORES_CONSUMO_BR = [1.14, 1.12, 1.08, 1.0, 0.9, 0.86, 0.88, 0.94, 0.98, 1.02, 1.06, 1.12];

export function parseBrNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  // Sem vírgula: pontos seguidos de 3 dígitos são separadores de milhar (ex.: "8.190")
  if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, "")) || 0;
  }
  return parseFloat(cleaned) || 0;
}

export function formatBrNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",");
}

function formatBrCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isModoMensal(data: PropostaSolar): boolean {
  return data.modoConsumo === "mensal" || data.usarConsumoDetalhado;
}

function mediaFatores(fatores: number[]): number {
  return fatores.reduce((a, b) => a + b, 0) / fatores.length;
}

function distribuirConsumoSazonal(media: number): number[] {
  const mediaFat = mediaFatores(FATORES_CONSUMO_BR);
  return FATORES_CONSUMO_BR.map((f) => media * (f / mediaFat));
}

export interface GeracaoMensalPoint {
  mes: string;
  geracao: number;
  consumo: number;
}

export interface PaybackPoint {
  periodo: string;
  economiaAcumulada: number;
  investimento: number;
}

export interface CalculoProposta {
  geracaoMensalMedia: number;
  geracaoAnual: number;
  economiaMensal: number;
  percentualCobertura: number;
  paybackMeses: number;
  paybackLabel: string;
  custoPorWp: number;
  areaModulos: number;
  totalModulos: number;
  investimentoTotal: number;
  investimentoMateriais: number;
  investimentoServicos: number;
  irradiacaoEstimada: number;
  geracaoMensal: GeracaoMensalPoint[];
  payback: PaybackPoint[];
}

function formatPaybackLabel(months: number): string {
  if (months <= 0) return "—";
  const anos = Math.floor(months / 12);
  const mesesRestantes = months % 12;
  if (anos === 0) return `${mesesRestantes} ${mesesRestantes === 1 ? "mês" : "meses"}`;
  if (mesesRestantes === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${mesesRestantes} ${mesesRestantes === 1 ? "mês" : "meses"}`;
}

function getConsumoMensal(data: PropostaSolar): number {
  if (isModoMensal(data) && data.consumoMensalDetalhado?.length === 12) {
    const valores = data.consumoMensalDetalhado.map(parseBrNumber).filter((v) => v > 0);
    if (valores.length > 0) {
      return valores.reduce((a, b) => a + b, 0) / valores.length;
    }
  }
  return parseBrNumber(data.consumoMedio12Meses);
}

function getConsumoPorMes(data: PropostaSolar, media: number): number[] {
  if (isModoMensal(data) && data.consumoMensalDetalhado?.length === 12) {
    return data.consumoMensalDetalhado.map((v) => parseBrNumber(v) || media);
  }
  if (media > 0) {
    return distribuirConsumoSazonal(media);
  }
  return Array(12).fill(0);
}

export function calcularKwpFromPlacas(qty: number, watts: number): number {
  if (qty <= 0 || watts <= 0) return 0;
  return (qty * watts) / 1000;
}

export function calcularGeracaoMensalKwp(
  kwp: number,
  fatorGeracaoKwp: number,
  perdasSistema: number,
  percentualGeracao: number
): number {
  if (kwp <= 0) return 0;
  return (
    (kwp * fatorGeracaoKwp * (percentualGeracao / 100) * (1 - perdasSistema / 100)) /
    12
  );
}

export function calcularKitEquipamento(kit: KitSistema, data: PropostaSolar) {
  const fator = parseBrNumber(data.fatorGeracaoKwp) || 1600;
  const perdas = parseBrNumber(data.perdasSistema) || 20;
  const pct = parseBrNumber(data.percentualGeracao) || 100;
  const valorKwh = parseBrNumber(data.valorKwh) || 0.65;
  const reducao = parseBrNumber(data.reducaoConta) || 100;
  const simult = parseBrNumber(data.simultaneidade) || 0;
  const tusdFactor = data.considerarTusdG ? 0.85 : 1;
  const simultFactor = 1 - (simult / 100) * 0.3;

  const qty = parseBrNumber(kit.quantidadePlacas);
  const watts = parseBrNumber(kit.potenciaPlacaW);
  let kwp = parseBrNumber(kit.potenciaKwp);

  if (qty > 0 && watts > 0) {
    kwp = calcularKwpFromPlacas(qty, watts);
  }

  const geracao =
    kwp > 0
      ? calcularGeracaoMensalKwp(kwp, fator, perdas, pct)
      : parseBrNumber(kit.geracaoMediaMensal);

  const economia =
    geracao > 0
      ? geracao * valorKwh * (reducao / 100) * tusdFactor * simultFactor
      : parseBrNumber(kit.economiaMediaMensal);

  return {
    potenciaKwp: kwp > 0 ? formatBrNumber(kwp) : kit.potenciaKwp,
    geracaoMediaMensal: geracao > 0 ? formatBrNumber(geracao) : "",
    economiaMediaMensal: economia > 0 ? formatBrNumber(economia) : kit.economiaMediaMensal,
  };
}

export function calcularProposta(data: PropostaSolar): CalculoProposta {
  const consumoMensal = getConsumoMensal(data);
  const consumoPorMes = getConsumoPorMes(data, consumoMensal);
  const valorKwh = parseBrNumber(data.valorKwh) || 0.65;
  const pctMateriais = parseBrNumber(data.percentualMateriais) || 70;
  const pctServicos = parseBrNumber(data.percentualServicos) || 30;
  const aumentoAnual = parseBrNumber(data.aumentoAnualEnergia) || 5;
  const perdaAnual = parseBrNumber(data.perdaPotenciaAnual) || 0.8;
  const perdasSistema = parseBrNumber(data.perdasSistema) || 20;
  const percentualGeracao = parseBrNumber(data.percentualGeracao) || 100;
  const simultaneidade = parseBrNumber(data.simultaneidade) || 0;
  const fatorIrradiacao = parseBrNumber(data.fatorGeracaoKwp) || 1600;
  const irradiacaoLocal = parseBrNumber(data.irradiacaoLocal);
  const reducao = parseBrNumber(data.reducaoConta) || 100;

  const totalKwp = data.kits.reduce((sum, k) => sum + parseBrNumber(k.potenciaKwp), 0);

  const investimento = parseBrNumber(data.investimentoTotal);

  const investimentoMateriais =
    investimento > 0 ? investimento * (pctMateriais / 100) : 0;
  const investimentoServicos =
    investimento > 0 ? investimento * (pctServicos / 100) : 0;

  let geracaoMensalMedia = data.kits.reduce(
    (sum, k) => sum + parseBrNumber(k.geracaoMediaMensal),
    0
  );

  let geracaoAnual = parseBrNumber(data.geracaoAnual);
  const fatorGeracao = (percentualGeracao / 100) * (1 - perdasSistema / 100);

  if (!geracaoMensalMedia && geracaoAnual) {
    geracaoMensalMedia = geracaoAnual / 12;
  } else if (!geracaoMensalMedia && totalKwp > 0) {
    geracaoAnual = totalKwp * fatorIrradiacao * fatorGeracao;
    geracaoMensalMedia = geracaoAnual / 12;
  } else if (geracaoMensalMedia && !geracaoAnual) {
    geracaoAnual = geracaoMensalMedia * 12;
  }

  // Sugestão kWp a partir do consumo
  if (!totalKwp && consumoMensal > 0 && fatorIrradiacao > 0) {
    const kwpSugerido = (consumoMensal * 12) / (fatorIrradiacao * fatorGeracao);
    geracaoAnual = kwpSugerido * fatorIrradiacao * fatorGeracao;
    geracaoMensalMedia = geracaoAnual / 12;
  }

  let economiaMensal = data.kits.reduce(
    (sum, k) => sum + parseBrNumber(k.economiaMediaMensal),
    0
  );

  if (!economiaMensal && geracaoMensalMedia > 0) {
    const tusdFactor = data.considerarTusdG ? 0.85 : 1;
    const simultFactor = 1 - simultaneidade / 100 * 0.3;
    economiaMensal =
      geracaoMensalMedia * valorKwh * (reducao / 100) * tusdFactor * simultFactor;
  }

  const percentualCobertura =
    consumoMensal > 0 && geracaoMensalMedia > 0
      ? Math.min(100, (geracaoMensalMedia / consumoMensal) * 100)
      : parseBrNumber(data.percentualCobertura);

  const custoPorWp =
    investimento > 0 && totalKwp > 0 ? investimento / (totalKwp * 1000) : 0;

  const totalModulos = data.kits.reduce(
    (s, k) => s + parseBrNumber(k.quantidadePlacas),
    0
  );

  const irradiacaoEstimada =
    irradiacaoLocal > 0
      ? irradiacaoLocal
      : fatorIrradiacao > 0
        ? fatorIrradiacao / 365
        : 0;

  const mediaFatores =
    FATORES_SAZONAIS.reduce((a, b) => a + b, 0) / FATORES_SAZONAIS.length;

  const geracaoMensal: GeracaoMensalPoint[] = MESES.map((mes, i) => ({
    mes,
    geracao: Math.round(geracaoMensalMedia * (FATORES_SAZONAIS[i] / mediaFatores)),
    consumo: Math.round(consumoPorMes[i]),
  }));

  const payback: PaybackPoint[] = [];
  let acumulado = 0;
  let paybackMeses = 0;
  const maxAnos = 15;

  for (let ano = 1; ano <= maxAnos; ano++) {
    const fatorTarifa = Math.pow(1 + aumentoAnual / 100, ano - 1);
    const fatorGeracaoAnual = Math.pow(1 - perdaAnual / 100, ano - 1);
    const economiaAno = economiaMensal * 12 * fatorTarifa * fatorGeracaoAnual;
    acumulado += economiaAno;

    payback.push({
      periodo: `Ano ${ano}`,
      economiaAcumulada: Math.round(acumulado),
      investimento: Math.round(investimento),
    });

    if (paybackMeses === 0 && investimento > 0 && acumulado >= investimento) {
      const acumuladoAnterior = acumulado - economiaAno;
      const restante = investimento - acumuladoAnterior;
      const mesesNoAno = Math.ceil((restante / economiaAno) * 12);
      paybackMeses = (ano - 1) * 12 + mesesNoAno;
    }
  }

  const paybackCalculado =
    paybackMeses > 0 ? formatPaybackLabel(paybackMeses) : "—";

  return {
    geracaoMensalMedia,
    geracaoAnual,
    economiaMensal,
    percentualCobertura,
    paybackMeses,
    paybackLabel: paybackCalculado,
    custoPorWp,
    areaModulos: 0,
    totalModulos,
    investimentoTotal: investimento,
    investimentoMateriais,
    investimentoServicos,
    irradiacaoEstimada,
    geracaoMensal,
    payback,
  };
}

export function aplicarCalculos(data: PropostaSolar): PropostaSolar {
  const calc = calcularProposta(data);
  const modoMensal = isModoMensal(data);

  return {
    ...data,
    modoConsumo: data.modoConsumo ?? (modoMensal ? "mensal" : "media"),
    usarConsumoDetalhado: modoMensal,
    logoUrl: data.logoUrl || DEFAULT_LOGO,
    validadeProposta: data.dataProposta
      ? calcularValidadeProposta(data.dataProposta)
      : data.validadeProposta,
    consumoMedio12Meses:
      modoMensal && data.consumoMensalDetalhado?.some((v) => parseBrNumber(v) > 0)
        ? formatBrNumber(getConsumoMensal(data), 0)
        : data.consumoMedio12Meses,
    geracaoAnual: calc.geracaoAnual
      ? formatBrNumber(calc.geracaoAnual, 0)
      : data.geracaoAnual,
    percentualCobertura: calc.percentualCobertura
      ? formatBrNumber(calc.percentualCobertura, 0)
      : data.percentualCobertura,
    payback: calc.paybackLabel !== "—" ? calc.paybackLabel : data.payback,
    custoPorWp: calc.custoPorWp ? formatBrNumber(calc.custoPorWp) : data.custoPorWp,
    investimentoMateriais:
      calc.investimentoMateriais > 0
        ? formatBrCurrency(calc.investimentoMateriais)
        : data.investimentoMateriais,
    investimentoServicos:
      calc.investimentoServicos > 0
        ? formatBrCurrency(calc.investimentoServicos)
        : data.investimentoServicos,
    irradiacaoLocal:
      calc.irradiacaoEstimada > 0 && !data.irradiacaoLocal
        ? formatBrNumber(calc.irradiacaoEstimada, 1)
        : data.irradiacaoLocal,
    kits: data.kits.map((kit) => ({
      ...kit,
      ...calcularKitEquipamento(kit, data),
    })),
  };
}
