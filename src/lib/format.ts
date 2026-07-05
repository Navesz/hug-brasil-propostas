export function formatCurrency(value: string | number): string {
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."))
      : value;
  if (isNaN(num)) return value.toString();
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(value: string | number, suffix = ""): string {
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."))
      : value;
  if (isNaN(num)) return value ? `${value}${suffix}` : "—";
  return `${num.toLocaleString("pt-BR")}${suffix}`;
}

export function tipoSistemaLabel(tipo: string): string {
  const map: Record<string, string> = {
    "on-grid": "On-Grid (Conectado à Rede)",
    "off-grid": "Off-Grid (Isolado)",
    hibrido: "Híbrido (On-Grid + Baterias)",
  };
  return map[tipo] ?? tipo;
}

export function tipoLigacaoLabel(tipo: string): string {
  const map: Record<string, string> = {
    monofasico: "Monofásico",
    bifasico: "Bifásico",
    trifasico: "Trifásico",
  };
  return map[tipo] ?? tipo;
}

export function tipoRedeLabel(tipo: string): string {
  const map: Record<string, string> = {
    residencial: "Residencial",
    comercial: "Comercial",
    rural: "Rural",
  };
  return map[tipo] ?? tipo;
}
