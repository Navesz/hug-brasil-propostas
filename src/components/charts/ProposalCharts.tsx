"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GeracaoMensalPoint, PaybackPoint } from "@/lib/calculations";

const BLUE = "#0066b3";
const GREEN = "#2ecc71";
const GRAY = "#94a3b8";
const CHART_FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const TICK_STYLE = { fontSize: 11, fill: "#64748b", fontFamily: CHART_FONT };

interface GeracaoMensalChartProps {
  data: GeracaoMensalPoint[];
}

export function GeracaoMensalChart({ data }: GeracaoMensalChartProps) {
  if (!data.some((d) => d.geracao > 0 || d.consumo > 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        Preencha geração ou consumo para exibir o gráfico
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="mes" tick={TICK_STYLE} />
          <YAxis
            tick={TICK_STYLE}
            label={{
              value: "kWh",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: "#94a3b8", fontFamily: CHART_FONT },
            }}
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value ?? 0).toLocaleString("pt-BR")} kWh`,
              name === "geracao" ? "Geração" : "Consumo",
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) => (value === "geracao" ? "Geração Solar" : "Consumo")}
            wrapperStyle={{ fontSize: 12, fontFamily: CHART_FONT }}
          />
          <Bar dataKey="geracao" fill={GREEN} radius={[4, 4, 0, 0]} name="geracao" />
          <Line
            type="monotone"
            dataKey="consumo"
            stroke={BLUE}
            strokeWidth={2}
            dot={{ r: 3, fill: BLUE }}
            name="consumo"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PaybackChartProps {
  data: PaybackPoint[];
  paybackLabel: string;
}

export function PaybackChart({ data, paybackLabel }: PaybackChartProps) {
  if (!data.length || data[0].investimento === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        Preencha investimento e economia para exibir o payback
      </div>
    );
  }

  const paybackAno = data.findIndex(
    (d) => d.economiaAcumulada >= d.investimento
  );

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="periodo" tick={TICK_STYLE} />
          <YAxis
            tick={TICK_STYLE}
            tickFormatter={(v) =>
              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
            }
          />
          <Tooltip
            formatter={(value) => [
              Number(value ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: CHART_FONT }} />
          {paybackAno >= 0 && (
            <ReferenceLine
              x={data[paybackAno].periodo}
              stroke={GREEN}
              strokeDasharray="4 4"
              label={{
                value: `Payback: ${paybackLabel}`,
                position: "top",
                fill: GREEN,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: CHART_FONT,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="investimento"
            stroke={GRAY}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="Investimento"
          />
          <Line
            type="monotone"
            dataKey="economiaAcumulada"
            stroke={GREEN}
            strokeWidth={3}
            dot={{ r: 4, fill: GREEN }}
            name="Economia Acumulada"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface EconomiaAnualChartProps {
  geracaoAnual: number;
  consumoAnual: number;
}

export function EconomiaAnualChart({
  geracaoAnual,
  consumoAnual,
}: EconomiaAnualChartProps) {
  const data = [
    { nome: "Geração Anual", valor: Math.round(geracaoAnual), fill: GREEN },
    { nome: "Consumo Anual", valor: Math.round(consumoAnual), fill: BLUE },
  ];

  if (!geracaoAnual && !consumoAnual) return null;

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20 }}>
          <XAxis type="number" tick={TICK_STYLE} />
          <YAxis
            type="category"
            dataKey="nome"
            tick={TICK_STYLE}
            width={112}
          />
          <Tooltip
            formatter={(v) => [`${Number(v ?? 0).toLocaleString("pt-BR")} kWh`, ""]}
            contentStyle={{ borderRadius: 12, fontSize: 12 }}
          />
          <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
            {data.map((entry) => (
              <Cell key={entry.nome} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
