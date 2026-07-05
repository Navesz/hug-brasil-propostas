"use client";

import { forwardRef, useMemo } from "react";
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

interface ProposalPreviewProps {
  data: PropostaSolar;
  hideValues?: boolean;
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
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

export const ProposalPreview = forwardRef<HTMLDivElement, ProposalPreviewProps>(
  function ProposalPreview({ data, hideValues = false }, ref) {
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
    const consumoAnual = parseBrNumber(data.consumoMedio12Meses) * 12;

    const formasAtivas = Object.entries(data.formasPagamento).filter(([, v]) => v);

    const tipoRede = tipoRedeLabel(data.tipoRede);

    return (
      <div
        ref={ref}
        className="proposal-document mx-auto w-full max-w-[210mm] bg-white text-slate-800 shadow-2xl"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-hug-blue to-[#1a6bb5] px-8 py-6 text-white">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {data.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.logoUrl}
                  alt="Logo HUG BRASIL"
                  className="h-16 w-auto max-w-[140px] rounded-lg bg-white/10 object-contain p-1"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold">
                  H
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HUG BRASIL</h1>
                <p className="text-sm text-white/80">Energia Solar</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{data.empresaNome}</p>
              <p className="text-white/80">CNPJ: {data.empresaCnpj}</p>
              {data.numeroOrcamento && (
                <p className="mt-2 rounded-lg bg-white/20 px-3 py-1 font-bold">
                  Orçamento Nº {data.numeroOrcamento}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Client bar */}
        <div className="border-b-4 border-hug-green bg-slate-50 px-8 py-5">
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
            <div className="text-sm sm:text-right">
              <p>
                <span className="text-slate-500">Data: </span>
                <strong>{data.dataProposta}</strong>
              </p>
              <p>
                <span className="text-slate-500">Validade: </span>
                <strong>{data.validadeProposta}</strong>
              </p>
              <p className="mt-2 inline-block rounded-full bg-hug-green/15 px-3 py-1 text-xs font-semibold text-hug-green">
                {tipoSistemaLabel(data.tipoSistema)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          {/* Intro */}
          <div>
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

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Potência Total",
                value: totalKwp ? formatNumber(totalKwp, " kWp") : "—",
                color: "bg-hug-blue/10 text-hug-blue",
              },
              {
                label: "Módulos",
                value: totalPlacas ? `${totalPlacas} un.` : "—",
                color: "bg-hug-green/10 text-hug-green",
              },
              {
                label: "Geração Mensal",
                value: geracaoMensal
                  ? formatNumber(geracaoMensal, " kWh")
                  : data.geracaoAnual
                    ? formatNumber(parseFloat(data.geracaoAnual) / 12, " kWh")
                    : "—",
                color: "bg-hug-blue/10 text-hug-blue",
              },
              {
                label: "Payback",
                value: calc.paybackLabel !== "—" ? calc.paybackLabel : data.payback || "—",
                color: "bg-hug-green/10 text-hug-green",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-xl p-4 text-center ${card.color}`}
              >
                <p className="text-xs font-medium opacity-80">{card.label}</p>
                <p className="mt-1 text-lg font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline etapas */}
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-hug-blue">
              Etapas do Projeto
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ETAPAS.map((etapa, i) => (
                <div key={etapa} className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-hug-blue text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <p className="mt-2 text-[10px] font-medium leading-tight text-slate-600 sm:text-xs">
                    {etapa}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-hug-blue">
                Geração Mensal Estimada
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Com base no sistema proposto, considerando perdas e irradiação do local,
                a geração mês a mês em média:
              </p>
              <GeracaoMensalChart data={calc.geracaoMensal} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-hug-green">
                  Geração vs Consumo Anual
                </h3>
                <p className="mb-4 text-xs text-slate-500">Comparativo em kWh/ano</p>
                <EconomiaAnualChart
                  geracaoAnual={calc.geracaoAnual}
                  consumoAnual={consumoAnual}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
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
          </div>

          {/* System info */}
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-hug-blue">
              Dados do Sistema
            </h3>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <InfoRow label="Tipo de Rede" value={tipoRede} />
              <InfoRow label="Tipo de Ligação" value={tipoLigacaoLabel(data.tipoLigacao)} />
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
              <InfoRow
                label="Certificação INMETRO"
                value={data.certificacaoInmetro}
              />
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
                  data.geracaoAnual ? `${formatNumber(data.geracaoAnual)} kWh` : undefined
                }
              />
              <InfoRow
                label="Nº de Módulos"
                value={calc.totalModulos > 0 ? `${calc.totalModulos} unidades` : undefined}
              />
            </div>
          </div>

          {/* Kits */}
          {data.kits.map((kit, i) => (
            <div key={kit.id} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="bg-gradient-to-r from-hug-blue/10 to-hug-green/10 px-5 py-3">
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
                      ["Potência do Sistema", kit.potenciaKwp ? `${kit.potenciaKwp} kWp` : ""],
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
                            ["Garantia Inversor On-Grid", kit.garantiaInversorOngrid],
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
                        <tr key={label as string} className="border-b border-slate-50">
                          <td className="py-2 pr-4 text-slate-500">{label}</td>
                          <td className="py-2 text-right font-medium">{value}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {data.notaTecnicaModulo && (
            <div className="rounded-xl border border-hug-blue/20 bg-hug-blue/5 p-4 text-sm text-slate-600">
              <strong className="text-hug-blue">* Nota técnica:</strong>{" "}
              {data.notaTecnicaModulo}
            </div>
          )}

          {/* Investment */}
          {!hideValues && (
          <div className="rounded-xl border-2 border-hug-green/30 bg-hug-green/5 p-5">
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
          )}

          {/* Payback note */}
          {!hideValues && (data.payback || calc.paybackLabel !== "—") && (
            <div className="rounded-xl bg-hug-blue/5 p-5 text-center">
              <p className="text-sm text-slate-500">Retorno do Investimento (Payback)</p>
              <p className="mt-1 text-3xl font-bold text-hug-blue">
                {calc.paybackLabel !== "—" ? calc.paybackLabel : data.payback}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Calculado com aumento anual de {data.aumentoAnualEnergia}% na energia e
                perda de {data.perdaPotenciaAnual}%/ano nos módulos
              </p>
            </div>
          )}

          {/* Warranties & process */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
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
            <div className="rounded-xl border border-slate-200 p-4">
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

          {data.observacoesFinanciamento && (
            <p className="text-sm italic text-slate-500">{data.observacoesFinanciamento}</p>
          )}
          {data.observacoes && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <strong>Observações:</strong> {data.observacoes}
            </div>
          )}

          {/* Signature */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600">
              Em razão de ambas as partes concordarem com a proposta acima especificada,
              declaram a aceitação da mesma. Assim sendo, dão seguimento às providências
              necessárias para a execução do projeto.
            </p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
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
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-8 py-4 text-center text-xs text-white/70">
          <p className="font-semibold text-white">{data.empresaNome}</p>
          <p>
            {data.empresaEndereco} | {data.empresaSite} | {data.empresaContato}
          </p>
        </div>
      </div>
    );
  }
);
