"use client";

import { forwardRef, useMemo, useRef } from "react";
import {
  Banknote,
  Barcode,
  CreditCard,
  Landmark,
  QrCode,
} from "lucide-react";
import type { PropostaSolar } from "@/types/proposal";
import {
  formatCurrency,
  formatNumber,
  tipoLigacaoLabel,
  tipoRedeLabel,
  tipoSistemaLabel,
} from "@/lib/format";
import { calcularProposta, parseBrNumber } from "@/lib/calculations";
import {
  EconomiaAnualChart,
  GeracaoMensalChart,
  PaybackChart,
} from "@/components/charts/ProposalCharts";
import { useA4Pagination } from "@/hooks/useA4Pagination";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  PDF_MARGIN_MM,
} from "@/lib/pdfConstants";

interface ProposalPreviewProps {
  data: PropostaSolar;
  hideValues?: boolean;
  showPageBreaks?: boolean;
}

const ETAPAS = [
  "Fechamento",
  "Projeto",
  "Homologação",
  "Compra de Materiais",
  "Instalação",
  "Start-Up",
];

const PAGAMENTO_ICONS: Record<string, { label: string; Icon: typeof Banknote }> = {
  transferencia: { label: "Transferência Bancária", Icon: Landmark },
  cartao: { label: "Cartão de Crédito", Icon: CreditCard },
  boleto: { label: "Boleto Bancário", Icon: Barcode },
  financiamento: { label: "Financiamento", Icon: Banknote },
  pix: { label: "Pix", Icon: QrCode },
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

function PdfSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return <div data-section-id={id}>{children}</div>;
}

export const ProposalPreview = forwardRef<HTMLDivElement, ProposalPreviewProps>(
  function ProposalPreview(
    { data, hideValues = false, showPageBreaks = true },
    ref
  ) {
    const measureRef = useRef<HTMLDivElement>(null);
    const calc = useMemo(() => calcularProposta(data), [data]);

    const totalKwp = data.kits.reduce(
      (sum, k) => sum + parseBrNumber(k.potenciaKwp),
      0
    );
    const totalPlacas = data.kits.reduce(
      (sum, k) => sum + (parseInt(k.quantidadePlacas) || 0),
      0
    );
    const geracaoMensal = calc.geracaoMensalMedia;
    const consumoAnual = calc.geracaoMensal.reduce((s, p) => s + p.consumo, 0);
    const formasAtivas = Object.entries(data.formasPagamento).filter(([, v]) => v);
    const tipoRede = tipoRedeLabel(data.tipoRede);

    const sectionBlocks = useMemo(() => {
      // Cada bloco interno é mantido junto na mesma página.
      const blocks: string[][] = [
        ["header", "client-bar", "intro"],
        ["kpi"],
        ["etapas"],
        ["chart-geracao"],
        ["chart-economia"],
        ["chart-payback"],
        ["system-info"],
      ];
      data.kits.forEach((_, i) => blocks.push([`kit-${i}`]));
      if (data.notaTecnicaModulo) blocks.push(["nota-tecnica"]);

      // Bloco financeiro final: investimento, payback e encerramento juntos.
      const finalBlock: string[] = [];
      if (!hideValues) finalBlock.push("investment");
      if (!hideValues && (data.payback || calc.paybackLabel !== "—")) {
        finalBlock.push("payback-note");
      }
      finalBlock.push("warranties");
      if (data.observacoesFinanciamento || data.observacoes) {
        finalBlock.push("observacoes");
      }
      finalBlock.push("signature", "footer");
      blocks.push(finalBlock);

      return blocks;
    }, [data, hideValues, calc.paybackLabel]);

    const sectionIds = useMemo(() => sectionBlocks.flat(), [sectionBlocks]);

    const pages = useA4Pagination(measureRef, sectionBlocks, showPageBreaks);

    const sections = useMemo(
      () => ({
        header: (
          <div
            data-pdf-header
            className="bg-gradient-to-r from-hug-blue to-[#1a6bb5] px-8 py-6 text-white"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-5">
                {data.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.logoUrl}
                    alt="Logo"
                    className="h-20 w-auto max-w-[180px] shrink-0 rounded-lg bg-white p-2 object-contain"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/20 text-3xl font-bold">
                    H
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/70">
                    Proposta Comercial
                  </p>
                  <p className="text-xl font-semibold leading-tight">Energia Solar</p>
                  {data.numeroOrcamento && (
                    <p className="mt-1 text-sm text-white/90">
                      Orçamento Nº <strong>{data.numeroOrcamento}</strong>
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="text-white/80">CNPJ {data.empresaCnpj}</p>
                <p className="mt-1 text-white/90">
                  <span className="text-white/70">Data: </span>
                  {data.dataProposta}
                </p>
                <p className="text-white/90">
                  <span className="text-white/70">Validade: </span>
                  {data.validadeProposta}
                </p>
              </div>
            </div>
          </div>
        ),
        "client-bar": (
          <div
            data-pdf-client-bar
            className="border-b-4 border-hug-green bg-slate-50 px-8 py-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-hug-blue">
                  Cliente
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {data.nomeCliente || "—"}
                </p>
                {data.enderecoInstalacao && (
                  <p className="mt-1 text-sm text-slate-600">{data.enderecoInstalacao}</p>
                )}
              </div>
              <div className="flex items-center justify-start sm:justify-end">
                <p className="inline-block rounded-full bg-hug-green/15 px-3 py-1 text-xs font-semibold text-hug-green">
                  {tipoSistemaLabel(data.tipoSistema)}
                </p>
              </div>
            </div>
          </div>
        ),
        intro: (
          <div className="px-8 pt-6">
            <p className="text-sm leading-relaxed text-slate-600">
              Conforme solicitado, encaminhamos à sua apreciação a proposta comercial para
              fornecimento do sistema fotovoltaico{" "}
              <strong>{tipoSistemaLabel(data.tipoSistema).toLowerCase()}</strong>
              {totalKwp > 0 && (
                <>
                  {" "}
                  com potência de <strong>{formatNumber(totalKwp, " kWp")}</strong>
                </>
              )}
              {calc.percentualCobertura > 0 && (
                <>
                  , capaz de suprir o consumo anual em{" "}
                  <strong>{calc.percentualCobertura.toFixed(0)}%</strong>
                </>
              )}
              {geracaoMensal > 0 && (
                <>
                  , produzindo uma média de{" "}
                  <strong>{formatNumber(geracaoMensal, " kWh")}</strong> ao mês
                </>
              )}
              {calc.geracaoAnual > 0 && (
                <>
                  , totalizando{" "}
                  <strong>{formatNumber(calc.geracaoAnual, " kWh")}</strong> ao ano
                </>
              )}
              .
            </p>
            {data.descricaoProjeto && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {data.descricaoProjeto}
              </p>
            )}
          </div>
        ),
        kpi: (
          <div className="grid grid-cols-2 gap-3 px-8 sm:grid-cols-4">
            {[
              {
                label: "Potência Total",
                value: totalKwp ? formatNumber(totalKwp, " kWp") : "—",
                variant: "blue" as const,
              },
              {
                label: "Módulos",
                value: totalPlacas ? `${totalPlacas} un.` : "—",
                variant: "green" as const,
              },
              {
                label: "Geração Mensal",
                value: geracaoMensal
                  ? formatNumber(geracaoMensal, " kWh")
                  : data.geracaoAnual
                    ? formatNumber(parseFloat(data.geracaoAnual) / 12, " kWh")
                    : "—",
                variant: "blue" as const,
              },
              {
                label: "Payback",
                value:
                  calc.paybackLabel !== "—" ? calc.paybackLabel : data.payback || "—",
                variant: "green" as const,
              },
            ].map((card) => (
              <div
                key={card.label}
                data-pdf-kpi={card.variant}
                className={`rounded-xl p-4 text-center ${
                  card.variant === "blue"
                    ? "bg-hug-blue/10 text-hug-blue"
                    : "bg-hug-green/10 text-hug-green"
                }`}
              >
                <p className="text-xs font-medium opacity-80">{card.label}</p>
                <p className="mt-1 text-lg font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        ),
        etapas: (
          <div className="px-8">
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-hug-blue">
                Etapas do Projeto
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {ETAPAS.map((etapa, i) => (
                  <div key={etapa} className="text-center">
                    <div
                      data-pdf-etapa-num
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-hug-blue text-sm font-bold text-white"
                    >
                      {i + 1}
                    </div>
                    <p className="mt-2 text-[10px] font-medium leading-tight text-slate-600 sm:text-xs">
                      {etapa}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
        "chart-geracao": (
          <div className="px-8">
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-5">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-hug-blue">
                Geração Mensal Estimada
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Com base no sistema proposto, considerando perdas e irradiação do local, a
                geração mês a mês em média:
              </p>
              <GeracaoMensalChart data={calc.geracaoMensal} />
            </div>
          </div>
        ),
        "chart-economia": (
          <div className="px-8">
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-5">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-hug-green">
                Geração vs Consumo Anual
              </h3>
              <p className="mb-4 text-xs text-slate-500">Comparativo em kWh/ano</p>
              <EconomiaAnualChart
                geracaoAnual={calc.geracaoAnual}
                consumoAnual={consumoAnual}
              />
            </div>
          </div>
        ),
        "chart-payback": (
          <div className="px-8">
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-5">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-hug-blue">
                Gráfico de Payback
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Aumento anual de {data.aumentoAnualEnergia}% na energia e perda de{" "}
                {data.perdaPotenciaAnual}%/ano nos módulos
              </p>
              <PaybackChart data={calc.payback} paybackLabel={calc.paybackLabel} />
            </div>
          </div>
        ),
        "system-info": (
          <div className="px-8">
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-hug-blue">
                Dados do Sistema
              </h3>
              <div className="grid gap-x-8 sm:grid-cols-2">
                <InfoRow label="Tipo de Rede" value={tipoRede} />
                <InfoRow
                  label="Tipo de Ligação"
                  value={tipoLigacaoLabel(data.tipoLigacao)}
                />
                <InfoRow label="Tensão" value={data.tensaoRede} />
                <InfoRow label="Concessionária" value={data.concessionaria} />
                <InfoRow
                  label="Irradiação Local"
                  value={
                    data.irradiacaoLocal
                      ? `${data.irradiacaoLocal} kWh/m²/dia`
                      : calc.irradiacaoEstimada
                        ? `${formatNumber(calc.irradiacaoEstimada, "")} kWh/m²/dia`
                        : undefined
                  }
                />
                <InfoRow label="Certificação INMETRO" value={data.certificacaoInmetro} />
                <InfoRow
                  label="Consumo Médio (12 meses)"
                  value={
                    data.consumoMedio12Meses
                      ? `${formatNumber(data.consumoMedio12Meses)} kWh`
                      : undefined
                  }
                />
                <InfoRow
                  label="Redução da Conta"
                  value={data.reducaoConta ? `${data.reducaoConta}% ao mês` : undefined}
                />
                <InfoRow
                  label="Cobertura do Consumo"
                  value={
                    data.percentualCobertura ? `${data.percentualCobertura}%` : undefined
                  }
                />
                <InfoRow
                  label="Geração Anual"
                  value={
                    data.geracaoAnual
                      ? `${formatNumber(data.geracaoAnual)} kWh`
                      : undefined
                  }
                />
                <InfoRow
                  label="Nº de Módulos"
                  value={
                    calc.totalModulos > 0 ? `${calc.totalModulos} unidades` : undefined
                  }
                />
              </div>
            </div>
          </div>
        ),
        ...Object.fromEntries(
          data.kits.map((kit, i) => [
            `kit-${i}`,
            <div key={kit.id} className="px-8">
              <div
                data-pdf-border="1"
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <div
                  data-pdf-kit-header
                  className="bg-gradient-to-r from-hug-blue/10 to-hug-green/10 px-5 py-3"
                >
                  <h3 className="font-bold text-slate-900">
                    {kit.titulo || `Kit ${i + 1}`}
                  </h3>
                  {kit.descricao && (
                    <p className="mt-1 text-sm text-slate-600">{kit.descricao}</p>
                  )}
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        [
                          "Potência do Sistema",
                          kit.potenciaKwp ? `${kit.potenciaKwp} kWp` : "",
                        ],
                        ["Quantidade de Placas", kit.quantidadePlacas],
                        [
                          "Potência da Placa",
                          kit.potenciaPlacaW ? `${kit.potenciaPlacaW} W` : "",
                        ],
                        ["Modelo das Placas", kit.modeloPlacas],
                        ["Garantia das Placas", kit.garantiaPlacas],
                        ...(data.tipoSistema === "hibrido"
                          ? [
                              ["Inversor Híbrido", kit.modeloInversorHibrido],
                              ["Garantia Inversor Híbrido", kit.garantiaInversorHibrido],
                              [
                                "Inversor On-Grid",
                                kit.quantidadeInversores
                                  ? `${kit.quantidadeInversores}x ${kit.modeloInversorOngrid}`
                                  : kit.modeloInversorOngrid,
                              ],
                              [
                                "Garantia Inversor On-Grid",
                                kit.garantiaInversorOngrid,
                              ],
                            ]
                          : [
                              [
                                "Inversor",
                                kit.quantidadeInversores
                                  ? `${kit.quantidadeInversores}x ${kit.modeloInversor}`
                                  : kit.modeloInversor,
                              ],
                              ["Garantia do Inversor", kit.garantiaInversor],
                            ]),
                        ...(data.tipoSistema !== "on-grid"
                          ? [
                              ["Bateria", kit.bateria],
                              ["Garantia Bateria (ciclos)", kit.garantiaBateriaCiclos],
                              ["Garantia Bateria (anos)", kit.garantiaBateriaAnos],
                            ]
                          : []),
                        [
                          "Geração Média Mensal",
                          kit.geracaoMediaMensal ? `${kit.geracaoMediaMensal} kWh` : "",
                        ],
                        ["Estruturas", kit.estruturas],
                        ["Acessórios", kit.acessorios],
                      ]
                        .filter(([, v]) => v)
                        .map(([label, value]) => (
                          <tr
                            key={label as string}
                            data-pdf-table-row
                            className="border-b border-slate-300 last:border-0"
                          >
                            <td className="py-2 pr-4 text-slate-500">{label}</td>
                            <td className="py-2 text-right font-medium">{value}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>,
          ])
        ),
        "nota-tecnica": data.notaTecnicaModulo ? (
          <div className="px-8">
            <div
              data-pdf-border="1"
              data-pdf-bg-blue
              className="rounded-xl border border-hug-blue/20 bg-hug-blue/5 p-4 text-sm text-slate-600"
            >
              <strong className="text-hug-blue">* Nota técnica:</strong>{" "}
              {data.notaTecnicaModulo}
            </div>
          </div>
        ) : null,
        investment: !hideValues ? (
          <div className="px-8">
            <div
              data-pdf-border="2"
              data-pdf-bg-green
              className="rounded-xl border-2 border-hug-green/30 bg-hug-green/5 p-5"
            >
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-hug-green">
                Investimento
              </h3>
              <div className="space-y-2">
                {data.investimentoMateriais && (
                  <div className="flex justify-between text-sm">
                    <span>Materiais</span>
                    <strong>{formatCurrency(data.investimentoMateriais)}</strong>
                  </div>
                )}
                {data.investimentoServicos && (
                  <div className="flex justify-between text-sm">
                    <span>Serviços de Instalação</span>
                    <strong>{formatCurrency(data.investimentoServicos)}</strong>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-hug-green/20 pt-3">
                  <span className="text-lg font-bold">Investimento Total</span>
                  <span className="text-2xl font-bold text-hug-green">
                    {data.investimentoTotal
                      ? formatCurrency(data.investimentoTotal)
                      : "—"}
                  </span>
                </div>
                {data.custoPorWp && (
                  <p className="text-right text-sm text-slate-500">
                    Custo por Wp instalado: R$ {data.custoPorWp}
                  </p>
                )}
              </div>
              {formasAtivas.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {formasAtivas.map(([key]) => {
                    const item = PAGAMENTO_ICONS[key];
                    if (!item) return null;
                    const { Icon, label } = item;
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center rounded-xl bg-white p-3 shadow-sm"
                      >
                        <Icon className="h-6 w-6 text-hug-blue" />
                        <span className="mt-1 text-center text-[10px] font-medium text-slate-600">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null,
        "payback-note":
          !hideValues && (data.payback || calc.paybackLabel !== "—") ? (
            <div className="px-8">
              <div
                data-pdf-bg-blue
                className="rounded-xl bg-hug-blue/5 p-4 text-center"
              >
                <p className="text-sm text-slate-500">Retorno do Investimento (Payback)</p>
                <p className="mt-1 text-2xl font-bold text-hug-blue">
                  {calc.paybackLabel !== "—" ? calc.paybackLabel : data.payback}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Calculado com aumento anual de {data.aumentoAnualEnergia}% na energia e
                  perda de {data.perdaPotenciaAnual}%/ano nos módulos
                </p>
              </div>
            </div>
          ) : null,
        warranties: (
          <div className="grid gap-4 px-8 sm:grid-cols-2">
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-4">
              <h4 className="mb-3 text-xs font-bold uppercase text-hug-blue">Garantias</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Módulos: {data.garantiaModulo}</li>
                <li>• Inversor: {data.garantiaInversorServico}</li>
                <li>• Serviços: {data.garantiaServicos}</li>
                {data.certificacaoInmetro && (
                  <li>• INMETRO: {data.certificacaoInmetro}</li>
                )}
              </ul>
            </div>
            <div data-pdf-border="1" className="rounded-xl border border-slate-200 p-4">
              <h4 className="mb-3 text-xs font-bold uppercase text-hug-blue">
                Resumo Técnico
              </h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Nº módulos: {calc.totalModulos || totalPlacas || "—"} unidades</li>
                <li>• Potência: {totalKwp ? formatNumber(totalKwp, " kWp") : "—"}</li>
                <li>• Validade: {data.validadeProposta}</li>
              </ul>
            </div>
          </div>
        ),
        observacoes:
          data.observacoesFinanciamento || data.observacoes ? (
            <div className="space-y-3 px-8">
              {data.observacoesFinanciamento && (
                <p className="text-sm italic text-slate-500">
                  {data.observacoesFinanciamento}
                </p>
              )}
              {data.observacoes && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  <strong>Observações:</strong> {data.observacoes}
                </div>
              )}
            </div>
          ) : null,
        signature: (
          <div className="border-t border-slate-200 px-8 pt-5">
            <p className="text-sm text-slate-600">
              Em razão de ambas as partes concordarem com a proposta acima especificada,
              declaram a aceitação da mesma. Assim sendo, dão seguimento às providências
              necessárias para a execução do projeto.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <div className="border-b border-slate-300 pb-1">
                  <p className="font-medium">{data.nomeCliente || "Cliente"}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">Cliente</p>
              </div>
              <div>
                <div className="border-b border-slate-300 pb-1">
                  <p className="font-medium">{data.representanteNome}</p>
                  <p className="text-xs text-slate-500">{data.representanteCnpj}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">Representante HUG BRASIL</p>
              </div>
            </div>
          </div>
        ),
        footer: (
          <div
            data-pdf-footer
            className="bg-slate-900 px-8 py-4 text-center text-xs text-white/70"
          >
            <p>
              {data.empresaEndereco} | {data.empresaSite} | {data.empresaContato}
            </p>
          </div>
        ),
      }),
      [
        data,
        calc,
        hideValues,
        totalKwp,
        totalPlacas,
        geracaoMensal,
        consumoAnual,
        formasAtivas,
        tipoRede,
      ]
    );

    const pageGroups = pages ?? [sectionIds];
    const pageStyle = {
      width: `${A4_WIDTH_MM}mm`,
      minHeight: `${A4_HEIGHT_MM}mm`,
      padding: `${PDF_MARGIN_MM}mm`,
    };

    const renderSection = (id: string) => {
      const content = sections[id as keyof typeof sections];
      if (!content) return null;
      return (
        <PdfSection key={id} id={id}>
          {content}
        </PdfSection>
      );
    };

    return (
      <>
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
          style={{ width: `${A4_WIDTH_MM}mm` }}
        >
          <div
            className="bg-white text-slate-800"
            style={{ fontFamily: "system-ui, sans-serif", width: `${A4_WIDTH_MM}mm` }}
          >
            {sectionIds.map((id) => renderSection(id))}
          </div>
        </div>

        <div
          ref={ref}
          className="proposal-document mx-auto w-full max-w-[210mm] text-slate-800"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {showPageBreaks ? (
            <div className="space-y-4">
              {pageGroups.map((group, pageIdx) => {
                const startsWithHeader = group[0] === "header";
                const hasFooter = group.includes("footer");
                return (
                  <div
                    key={pageIdx}
                    className="pdf-page relative flex flex-col bg-white shadow-2xl"
                    data-page={pageIdx + 1}
                    style={pageStyle}
                  >
                    <span className="pdf-page-label absolute right-3 top-2 text-[10px] font-medium text-slate-400">
                      Página {pageIdx + 1}
                    </span>
                    <div
                      className={`flex flex-1 flex-col gap-6 ${
                        startsWithHeader ? "" : "pt-8"
                      } ${hasFooter ? "" : "pb-6"}`}
                    >
                      {group.map((id) => {
                        const content = sections[id as keyof typeof sections];
                        if (!content) return null;
                        // Footer sempre ancorado no fundo da página
                        if (id === "footer") {
                          return (
                            <div key={id} className="mt-auto">
                              {content}
                            </div>
                          );
                        }
                        return <div key={id}>{content}</div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white shadow-2xl">
              {sectionIds.map((id) => {
                const content = sections[id as keyof typeof sections];
                if (!content) return null;
                return <div key={id}>{content}</div>;
              })}
            </div>
          )}
        </div>
      </>
    );
  }
);
