import type { PropostaSolar } from "@/types/proposal";
import { parseBrNumber } from "@/lib/calculations";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validarProposta(data: PropostaSolar): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data.nomeCliente.trim()) {
    issues.push({ field: "nomeCliente", message: "Nome do cliente é obrigatório" });
  }

  const totalKwp = data.kits.reduce(
    (s, k) => s + parseBrNumber(k.potenciaKwp),
    0
  );
  if (totalKwp <= 0) {
    issues.push({
      field: "potenciaKwp",
      message: "Informe a potência do sistema (kWp) em pelo menos um kit",
    });
  }

  const temPlacas = data.kits.some((k) => parseBrNumber(k.quantidadePlacas) > 0);
  if (!temPlacas) {
    issues.push({
      field: "quantidadePlacas",
      message: "Informe a quantidade de placas",
    });
  }

  if (!data.ocultarValores && parseBrNumber(data.investimentoTotal) <= 0) {
    issues.push({
      field: "investimentoTotal",
      message: "Informe o investimento total (ou marque 'ocultar valores')",
    });
  }

  if (!data.numeroOrcamento.trim()) {
    issues.push({
      field: "numeroOrcamento",
      message: "Número do orçamento é recomendado",
    });
  }

  return issues;
}

export function validarPropostaParaPdf(data: PropostaSolar): {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const all = validarProposta(data);
  const errors = all.filter((i) =>
    ["nomeCliente", "potenciaKwp", "quantidadePlacas", "investimentoTotal"].includes(
      i.field
    )
  );
  const warnings = all.filter((i) => !errors.includes(i));
  return { valid: errors.length === 0, errors, warnings };
}
