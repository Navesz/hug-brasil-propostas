"use client";

import { Calculator } from "lucide-react";
import type { PropostaSolar } from "@/types/proposal";
import { CONCESSIONARIAS, MESES_COMPLETOS } from "@/lib/constants";
import { Field, Select, Checkbox } from "./ui/FormFields";

interface CalculadoraAvancadaProps {
  data: PropostaSolar;
  onChange: (data: PropostaSolar) => void;
}

export function CalculadoraAvancada({ data, onChange }: CalculadoraAvancadaProps) {
  const set = <K extends keyof PropostaSolar>(key: K, value: PropostaSolar[K]) => {
    onChange({ ...data, [key]: value });
  };

  const setConsumoMes = (index: number, value: string) => {
    const next = [...data.consumoMensalDetalhado];
    next[index] = value;
    set("consumoMensalDetalhado", next);
  };

  return (
    <div className="mt-5 rounded-xl border border-hug-blue/20 bg-hug-blue/5 p-5">
      <h4 className="mb-3 flex items-center gap-2 font-semibold text-hug-blue">
        <Calculator className="h-4 w-4" />
        Calculadora Solar Avançada
      </h4>
      <p className="mb-4 text-xs text-slate-500">
        Os cálculos são atualizados automaticamente ao preencher os campos.
      </p>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Valor kWh (R$)"
          value={data.valorKwh}
          onChange={(v) => set("valorKwh", v)}
          placeholder="0,65"
        />
        <Field
          label="Perdas do Sistema (%)"
          value={data.perdasSistema}
          onChange={(v) => set("perdasSistema", v)}
          hint="Recomendado: 15–25%"
        />
        <Field
          label="Geração por kWp/ano (kWh)"
          value={data.fatorGeracaoKwp}
          onChange={(v) => set("fatorGeracaoKwp", v)}
          hint="Brasil: 1500–1700"
        />
        <Field
          label="Percentual Geração (%)"
          value={data.percentualGeracao}
          onChange={(v) => set("percentualGeracao", v)}
        />
        <Field
          label="Simultaneidade (%)"
          value={data.simultaneidade}
          onChange={(v) => set("simultaneidade", v)}
          hint="Autoconsumo instantâneo"
        />
        <Field
          label="Irradiação Local (kWh/m²/dia)"
          value={data.irradiacaoLocal}
          onChange={(v) => set("irradiacaoLocal", v)}
          placeholder="Ex: 4,5"
        />
        <Select
          label="Tipo de Rede"
          value={data.tipoRede}
          onChange={(v) => set("tipoRede", v as PropostaSolar["tipoRede"])}
          options={[
            { value: "residencial", label: "Residencial" },
            { value: "comercial", label: "Comercial" },
            { value: "rural", label: "Rural" },
          ]}
        />
        <Select
          label="Concessionária"
          value={data.concessionaria}
          onChange={(v) => set("concessionaria", v)}
          options={[
            { value: "", label: "Selecione..." },
            ...CONCESSIONARIAS.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      <Checkbox
        label="Considerar TUSD-G no cálculo"
        checked={data.considerarTusdG}
        onChange={(v) => set("considerarTusdG", v)}
      />

      <div className="mt-4">
        <Checkbox
          label="Usar consumo mensal detalhado (12 meses)"
          checked={data.usarConsumoDetalhado}
          onChange={(v) => set("usarConsumoDetalhado", v)}
        />
        {data.usarConsumoDetalhado && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {MESES_COMPLETOS.map((mes, i) => (
              <Field
                key={mes}
                label={`${mes} (kWh)`}
                value={data.consumoMensalDetalhado[i] || ""}
                onChange={(v) => setConsumoMes(i, v)}
                placeholder="kWh"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
