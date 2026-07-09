"use client";

import { useRef } from "react";
import { Cpu, ImagePlus, Plus, Trash2, Zap } from "lucide-react";
import { CalculadoraAvancada } from "@/components/CalculadoraAvancada";
import type { KitSistema, PropostaSolar, TipoSistema } from "@/types/proposal";
import { createEmptyKit } from "@/lib/defaultProposal";
import { Field, ReadOnlyField, SectionCard, Select, TextArea } from "./ui/FormFields";
import { parseBrNumber } from "@/lib/calculations";
import { compressImageFile } from "@/lib/imageUtils";

interface ProposalFormProps {
  data: PropostaSolar;
  onChange: (data: PropostaSolar) => void;
}

function updateKit(
  kits: KitSistema[],
  id: string,
  field: keyof KitSistema,
  value: string
): KitSistema[] {
  return kits.map((k) => (k.id === id ? { ...k, [field]: value } : k));
}

export function ProposalForm({ data, onChange }: ProposalFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PropostaSolar>(key: K, value: PropostaSolar[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      set("logoUrl", compressed);
    } catch {
      alert("Não foi possível processar a imagem. Tente outro arquivo.");
    }
    e.target.value = "";
  };

  const addKit = () => {
    set("kits", [...data.kits, createEmptyKit(`Kit ${data.kits.length + 1}`)]);
  };

  const removeKit = (id: string) => {
    if (data.kits.length <= 1) return;
    set(
      "kits",
      data.kits.filter((k) => k.id !== id)
    );
  };

  const showBateria = data.tipoSistema === "hibrido" || data.tipoSistema === "off-grid";
  const showHibrido = data.tipoSistema === "hibrido";
  const showOngridOnly = data.tipoSistema === "on-grid";

  return (
    <div className="space-y-5">
      <SectionCard
        step={1}
        title="Identidade & Cliente"
        subtitle="Logo da empresa e dados do cliente"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Logo da Empresa
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-hug-blue/40 bg-hug-blue/5 transition hover:border-hug-blue hover:bg-hug-blue/10"
              >
                {data.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.logoUrl}
                    alt="Logo"
                    className="h-full w-full rounded-xl object-contain p-1"
                  />
                ) : (
                  <ImagePlus className="h-8 w-8 text-hug-blue" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="text-sm text-slate-500">
                <p>Clique para enviar a logo da empresa</p>
                <p className="text-xs">PNG, JPG ou SVG recomendado</p>
                {data.logoUrl && (
                  <button
                    type="button"
                    onClick={() => set("logoUrl", "")}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome do Cliente"
              value={data.nomeCliente}
              onChange={(v) => set("nomeCliente", v)}
              placeholder="Ex: Dr. Antonio Capella"
              required
            />
            <ReadOnlyField
              label="Nº do Orçamento"
              value={data.numeroOrcamento}
              hint="Gerado automaticamente (0001, 0002…)"
            />
          </div>

          <Field
            label="Endereço de Instalação"
            value={data.enderecoInstalacao}
            onChange={(v) => set("enderecoInstalacao", v)}
            placeholder="Endereço completo"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Data da Proposta"
              value={data.dataProposta}
              onChange={(v) => set("dataProposta", v)}
            />
            <ReadOnlyField
              label="Validade da Proposta"
              value={data.validadeProposta}
              hint="Calculada automaticamente (+7 dias)"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        step={2}
        title="Tipo de Sistema"
        subtitle="On-Grid, Off-Grid ou Híbrido — diferencial da GDPlace"
      >
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { value: "on-grid", label: "On-Grid", desc: "Conectado à rede elétrica" },
              { value: "off-grid", label: "Off-Grid", desc: "Sistema isolado com baterias" },
              { value: "hibrido", label: "Híbrido", desc: "Rede + baterias de backup" },
            ] as { value: TipoSistema; label: string; desc: string }[]
          ).map((tipo) => (
            <button
              key={tipo.value}
              type="button"
              onClick={() => set("tipoSistema", tipo.value)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                data.tipoSistema === tipo.value
                  ? "border-hug-green bg-hug-green/10 shadow-md"
                  : "border-slate-200 hover:border-hug-blue/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap
                  className={`h-5 w-5 ${
                    data.tipoSistema === tipo.value ? "text-hug-green" : "text-slate-400"
                  }`}
                />
                <span className="font-semibold text-slate-900">{tipo.label}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{tipo.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Tipo de Ligação"
            value={data.tipoLigacao}
            onChange={(v) => set("tipoLigacao", v as PropostaSolar["tipoLigacao"])}
            options={[
              { value: "monofasico", label: "Monofásico" },
              { value: "bifasico", label: "Bifásico" },
              { value: "trifasico", label: "Trifásico" },
            ]}
          />
          <Field
            label="Tensão"
            value={data.tensaoRede}
            onChange={(v) => set("tensaoRede", v)}
            placeholder="Ex: 380V"
            hint="Apenas o valor da tensão"
          />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Forma de entrada do consumo</p>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: "media", label: "Média mensal anual", desc: "Uma média + variação sazonal no gráfico" },
                { value: "mensal", label: "Mês a mês manual", desc: "Informar cada mês separadamente" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    modoConsumo: opt.value,
                    usarConsumoDetalhado: opt.value === "mensal",
                  })
                }
                className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                  data.modoConsumo === opt.value
                    ? "border-hug-blue bg-hug-blue/10"
                    : "border-slate-200 hover:border-hug-blue/40"
                }`}
              >
                <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.modoConsumo !== "mensal" && (
            <Field
              label="Consumo Médio (12 meses) kWh"
              value={data.consumoMedio12Meses}
              onChange={(v) => set("consumoMedio12Meses", v)}
              placeholder="Ex: 500"
            />
          )}
          <Field
            label="Redução da Conta (%)"
            value={data.reducaoConta}
            onChange={(v) => set("reducaoConta", v)}
            placeholder="Ex: 96"
          />
        </div>

        <div className="mt-3 rounded-lg bg-hug-green/10 px-4 py-3 text-sm text-hug-green">
          <strong>Nº total de módulos:</strong>{" "}
          {data.kits.reduce((s, k) => s + parseBrNumber(k.quantidadePlacas), 0) || "—"}{" "}
          unidades
        </div>

        <CalculadoraAvancada data={data} onChange={onChange} />

        <div className="mt-4">
          <TextArea
            label="Descrição do Projeto"
            value={data.descricaoProjeto}
            onChange={(v) => set("descricaoProjeto", v)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard
        step={3}
        title="Equipamentos"
        subtitle="Placas, inversores e baterias por kit"
      >
        <div className="space-y-6">
          {data.kits.map((kit, index) => (
            <div
              key={kit.id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <Cpu className="h-4 w-4 text-hug-blue" />
                  {kit.titulo}
                </h3>
                {data.kits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKit(kit.id)}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Título do Kit"
                  value={kit.titulo}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "titulo", v))
                  }
                />
              </div>

              <div className="mt-4">
                <TextArea
                  label="Descrição do Kit"
                  value={kit.descricao}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "descricao", v))
                  }
                  rows={2}
                />
              </div>

              <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-hug-blue">
                Módulos Fotovoltaicos
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Quantidade de Placas"
                  value={kit.quantidadePlacas}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "quantidadePlacas", v))
                  }
                  placeholder="Ex: 7"
                />
                <Field
                  label="Potência da Placa (W)"
                  value={kit.potenciaPlacaW}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "potenciaPlacaW", v))
                  }
                  placeholder="Ex: 610"
                />
                <Field
                  label="Modelo das Placas"
                  value={kit.modeloPlacas}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "modeloPlacas", v))
                  }
                  placeholder="Ex: JA SOLAR 615W"
                />
                <Field
                  label="Garantia das Placas"
                  value={kit.garantiaPlacas}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "garantiaPlacas", v))
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ReadOnlyField
                  label="Potência do Sistema (kWp)"
                  value={kit.potenciaKwp}
                  hint="Calculado: qtd. placas × watts ÷ 1000"
                />
                <ReadOnlyField
                  label="Geração Média Mensal (kWh)"
                  value={kit.geracaoMediaMensal}
                  hint={`Com perdas de ${data.perdasSistema || "20"}% aplicadas`}
                />
              </div>

              {showHibrido && (
                <>
                  <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-hug-green">
                    Inversor Híbrido
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="Modelo Inversor Híbrido"
                      value={kit.modeloInversorHibrido}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "modeloInversorHibrido", v))
                      }
                      placeholder="Ex: FOXESS 7.5 kW"
                    />
                    <Field
                      label="Garantia Inversor Híbrido"
                      value={kit.garantiaInversorHibrido}
                      onChange={(v) =>
                        set(
                          "kits",
                          updateKit(data.kits, kit.id, "garantiaInversorHibrido", v)
                        )
                      }
                    />
                  </div>

                  <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-hug-blue">
                    Inversor On-Grid
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="Qtd. Inversores On-Grid"
                      value={kit.quantidadeInversores}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "quantidadeInversores", v))
                      }
                    />
                    <Field
                      label="Modelo Inversor On-Grid"
                      value={kit.modeloInversorOngrid}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "modeloInversorOngrid", v))
                      }
                      placeholder="Ex: SOLIS 30 kW"
                    />
                    <Field
                      label="Garantia Inversor On-Grid"
                      value={kit.garantiaInversorOngrid}
                      onChange={(v) =>
                        set(
                          "kits",
                          updateKit(data.kits, kit.id, "garantiaInversorOngrid", v)
                        )
                      }
                    />
                  </div>
                </>
              )}

              {(showOngridOnly || data.tipoSistema === "off-grid") && (
                <>
                  <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-hug-blue">
                    Inversor{data.tipoSistema === "off-grid" ? " Off-Grid" : ""}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="Quantidade de Inversores"
                      value={kit.quantidadeInversores}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "quantidadeInversores", v))
                      }
                    />
                    <Field
                      label="Modelo do Inversor"
                      value={kit.modeloInversor}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "modeloInversor", v))
                      }
                      placeholder="Ex: SOLIS S6-GR1P3K-M"
                    />
                    <Field
                      label="Garantia do Inversor"
                      value={kit.garantiaInversor}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "garantiaInversor", v))
                      }
                    />
                  </div>
                </>
              )}

              {showBateria && (
                <>
                  <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-hug-green">
                    Baterias
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="Bateria"
                      value={kit.bateria}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "bateria", v))
                      }
                      placeholder="Ex: 2 x 5.2 kWh FoxESS"
                    />
                    <Field
                      label="Garantia Bateria (ciclos)"
                      value={kit.garantiaBateriaCiclos}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "garantiaBateriaCiclos", v))
                      }
                    />
                    <Field
                      label="Garantia Bateria (anos)"
                      value={kit.garantiaBateriaAnos}
                      onChange={(v) =>
                        set("kits", updateKit(data.kits, kit.id, "garantiaBateriaAnos", v))
                      }
                    />
                  </div>
                </>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Estruturas"
                  value={kit.estruturas}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "estruturas", v))
                  }
                />
                <Field
                  label="Acessórios"
                  value={kit.acessorios}
                  onChange={(v) =>
                    set("kits", updateKit(data.kits, kit.id, "acessorios", v))
                  }
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addKit}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hug-blue/30 py-3 text-sm font-medium text-hug-blue transition hover:border-hug-blue hover:bg-hug-blue/5"
          >
            <Plus className="h-4 w-4" />
            Adicionar outro Kit
          </button>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Certificação INMETRO dos Módulos"
              value={data.certificacaoInmetro}
              onChange={(v) => set("certificacaoInmetro", v)}
              placeholder="Classe A"
            />
          </div>
          <TextArea
            label="Nota Técnica do Módulo"
            value={data.notaTecnicaModulo}
            onChange={(v) => set("notaTecnicaModulo", v)}
            placeholder="Ex: Classificação AAA na Pirâmide de Bancabilidade..."
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard
        step={4}
        title="Financeiro & Payback"
        subtitle="Investimento, formas de pagamento e retorno"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Custo Referência (R$/kWp)"
            value={data.custoReferenciaKwp}
            onChange={(v) => set("custoReferenciaKwp", v)}
            placeholder="Ex: 4,50"
            hint="Base para calcular investimento total"
          />
          <Field
            label="% Materiais"
            value={data.percentualMateriais}
            onChange={(v) => set("percentualMateriais", v)}
            placeholder="70"
          />
          <Field
            label="% Serviços de Instalação"
            value={data.percentualServicos}
            onChange={(v) => set("percentualServicos", v)}
            placeholder="30"
          />
          <ReadOnlyField
            label="Investimento Total (R$)"
            value={data.investimentoTotal}
            hint="kWp × custo referência"
          />
          <ReadOnlyField
            label="Materiais (R$)"
            value={data.investimentoMateriais}
            hint={`${data.percentualMateriais || "70"}% do total`}
          />
          <ReadOnlyField
            label="Serviços de Instalação (R$)"
            value={data.investimentoServicos}
            hint={`${data.percentualServicos || "30"}% do total`}
          />
          <ReadOnlyField
            label="Custo por Wp (R$)"
            value={data.custoPorWp}
          />
          <ReadOnlyField
            label="Payback"
            value={data.payback}
          />
          <ReadOnlyField
            label="Geração Anual (kWh)"
            value={data.geracaoAnual}
          />
          <ReadOnlyField
            label="Cobertura do Consumo (%)"
            value={data.percentualCobertura}
          />
          <Field
            label="Aumento Anual Energia (%)"
            value={data.aumentoAnualEnergia}
            onChange={(v) => set("aumentoAnualEnergia", v)}
          />
          <Field
            label="Perda Potência/Ano (%)"
            value={data.perdaPotenciaAnual}
            onChange={(v) => set("perdaPotenciaAnual", v)}
          />
        </div>

        <p className="mb-3 mt-5 text-sm font-medium text-slate-700">Formas de Pagamento</p>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["transferencia", "Transferência"],
              ["cartao", "Cartão"],
              ["boleto", "Boleto"],
              ["financiamento", "Financiamento"],
              ["pix", "Pix"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                data.formasPagamento[key]
                  ? "border-hug-green bg-hug-green/10 text-hug-green"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <input
                type="checkbox"
                checked={data.formasPagamento[key]}
                onChange={(e) =>
                  set("formasPagamento", {
                    ...data.formasPagamento,
                    [key]: e.target.checked,
                  })
                }
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field
            label="Garantia Módulos"
            value={data.garantiaModulo}
            onChange={(v) => set("garantiaModulo", v)}
          />
          <Field
            label="Garantia Inversor"
            value={data.garantiaInversorServico}
            onChange={(v) => set("garantiaInversorServico", v)}
          />
          <Field
            label="Garantia Serviços"
            value={data.garantiaServicos}
            onChange={(v) => set("garantiaServicos", v)}
          />
        </div>

        <div className="mt-4 space-y-4">
          <TextArea
            label="Observações sobre Financiamento"
            value={data.observacoesFinanciamento}
            onChange={(v) => set("observacoesFinanciamento", v)}
          />
          <TextArea
            label="Observações Gerais"
            value={data.observacoes}
            onChange={(v) => set("observacoes", v)}
          />
        </div>

      </SectionCard>

      <SectionCard
        step={5}
        title="Dados da Empresa"
        subtitle="Informações que aparecem no rodapé da proposta"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome da Empresa"
            value={data.empresaNome}
            onChange={(v) => set("empresaNome", v)}
          />
          <Field
            label="CNPJ"
            value={data.empresaCnpj}
            onChange={(v) => set("empresaCnpj", v)}
          />
          <Field
            label="Contato Comercial"
            value={data.empresaContato}
            onChange={(v) => set("empresaContato", v)}
          />
          <Field
            label="Site"
            value={data.empresaSite}
            onChange={(v) => set("empresaSite", v)}
          />
          <Field
            label="Representante"
            value={data.representanteNome}
            onChange={(v) => set("representanteNome", v)}
          />
          <Field
            label="CNPJ Representante"
            value={data.representanteCnpj}
            onChange={(v) => set("representanteCnpj", v)}
          />
        </div>
        <div className="mt-4">
          <TextArea
            label="Endereço da Empresa"
            value={data.empresaEndereco}
            onChange={(v) => set("empresaEndereco", v)}
            rows={2}
          />
        </div>
      </SectionCard>

    </div>
  );
}
