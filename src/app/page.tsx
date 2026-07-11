"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FileText, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ProposalForm } from "@/components/ProposalForm";
import { ProposalPreview } from "@/components/ProposalPreview";
import { ProposalToolbar } from "@/components/ProposalToolbar";
import { createDefaultProposal, normalizarProposta } from "@/lib/defaultProposal";
import { aplicarCalculos } from "@/lib/calculations";
import { generatePdfFromElement } from "@/lib/generatePdf";
import {
  carregarRascunho,
  salvarRascunho,
  gerarProximoNumeroOrcamento,
  inicializarSequenciaOrcamentos,
} from "@/lib/storage";
import { duplicarProposta } from "@/lib/templates";
import { validarPropostaParaPdf } from "@/lib/validation";
import type { PropostaSolar } from "@/types/proposal";

function mergeWithDefaults(data: Partial<PropostaSolar>): PropostaSolar {
  const base = createDefaultProposal();
  return aplicarCalculos({
    ...base,
    ...normalizarProposta(data),
    kits: data.kits?.length
      ? data.kits.map((k, i) => ({ ...base.kits[0], ...k, id: k.id || `kit-${i}` }))
      : base.kits,
    consumoMensalDetalhado:
      data.consumoMensalDetalhado?.length === 12
        ? data.consumoMensalDetalhado
        : base.consumoMensalDetalhado,
    formasPagamento: { ...base.formasPagamento, ...data.formasPagamento },
  });
}

export default function HomePage() {
  const [data, setData] = useState<PropostaSolar>(() =>
    aplicarCalculos(createDefaultProposal())
  );
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [lastSaved, setLastSaved] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateData = useCallback((next: PropostaSolar) => {
    setData(next);
  }, []);

  useEffect(() => {
    inicializarSequenciaOrcamentos();
    void (async () => {
      const draft = await carregarRascunho();
      let merged = draft ? mergeWithDefaults(draft) : createDefaultProposal(true);
      if (!merged.numeroOrcamento) {
        merged = { ...merged, numeroOrcamento: gerarProximoNumeroOrcamento() };
      }
      setData(aplicarCalculos(merged));
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (calcTimer.current) clearTimeout(calcTimer.current);
    calcTimer.current = setTimeout(() => {
      setData((prev) => {
        const next = aplicarCalculos(prev);
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });
    }, 500);
    return () => {
      if (calcTimer.current) clearTimeout(calcTimer.current);
    };
  }, [
    hydrated,
    data.consumoMedio12Meses,
    data.consumoMensalDetalhado,
    data.modoConsumo,
    data.usarConsumoDetalhado,
    data.dataProposta,
    data.percentualMateriais,
    data.percentualServicos,
    data.investimentoTotal,
    data.valorKwh,
    data.perdasSistema,
    data.fatorGeracaoKwp,
    data.percentualGeracao,
    data.simultaneidade,
    data.considerarTusdG,
    data.reducaoConta,
    data.aumentoAnualEnergia,
    data.perdaPotenciaAnual,
    data.kits.map((k) =>
      `${k.potenciaKwp}|${k.quantidadePlacas}|${k.potenciaPlacaW}|${k.geracaoMediaMensal}`
    ).join(";"),
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void salvarRascunho(data).then((result) => {
        if (result.ok) {
          setLastSaved(new Date().toLocaleTimeString("pt-BR"));
        }
        if (result.warning) {
          console.warn(result.warning);
        }
      });
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, hydrated]);

  const getFilename = useCallback(() => {
    const clientName = data.nomeCliente
      ? data.nomeCliente.replace(/[^a-zA-Z0-9]/g, "_")
      : "Cliente";
    const orcNum = data.numeroOrcamento || "proposta";
    return `HUG_BRASIL_${clientName}_${orcNum}.pdf`;
  }, [data.nomeCliente, data.numeroOrcamento]);

  const handleExportPdf = useCallback(async () => {
    const { valid, errors, warnings } = validarPropostaParaPdf(data);

    if (!valid) {
      alert(
        "Corrija os campos obrigatórios:\n\n" +
          errors.map((e) => `• ${e.message}`).join("\n")
      );
      return;
    }

    if (warnings.length > 0) {
      const proceed = confirm(
        "Avisos:\n" +
          warnings.map((w) => `• ${w.message}`).join("\n") +
          "\n\nDeseja gerar o PDF mesmo assim?"
      );
      if (!proceed) return;
    }

    if (!previewRef.current) return;
    setExporting(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      await generatePdfFromElement(previewRef.current, getFilename());
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }, [data, getFilename]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-hug-blue/5">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-hug-blue to-hug-green text-lg font-bold text-white">
              H
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">HUG BRASIL</h1>
              <p className="text-xs text-slate-500">Gerador de Propostas Solares</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:flex"
            >
              {showPreview ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
              {showPreview ? "Ocultar Preview" : "Mostrar Preview"}
            </button>

            <div className="flex rounded-xl border border-slate-200 lg:hidden">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
                  activeTab === "form"
                    ? "bg-hug-blue text-white rounded-l-xl"
                    : "text-slate-600"
                }`}
              >
                <FileText className="h-4 w-4" />
                Formulário
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
                  activeTab === "preview"
                    ? "bg-hug-blue text-white rounded-r-xl"
                    : "text-slate-600"
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
        <ProposalToolbar
          data={data}
          onLoad={(d) => setData(aplicarCalculos(mergeWithDefaults(d)))}
          onNew={() => setData(aplicarCalculos(createDefaultProposal(true)))}
          onDuplicate={() => setData(aplicarCalculos(duplicarProposta(data)))}
          lastSaved={lastSaved}
        />

        <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          <div
            className={`${activeTab === "form" ? "block" : "hidden"} lg:block ${
              !showPreview ? "max-w-3xl mx-auto w-full" : ""
            }`}
          >
            <ProposalForm data={data} onChange={updateData} />
          </div>

          {showPreview && (
            <div className={`${activeTab === "preview" ? "block" : "hidden"} lg:block`}>
              <div className="sticky top-20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Eye className="h-4 w-4 text-hug-blue" />
                    Pré-visualização
                  </h2>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-lg bg-hug-green px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:text-sm"
                  >
                    {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {exporting ? "Gerando PDF..." : "Gerar PDF"}
                  </button>
                </div>
                <div
                  id="preview-scroll-container"
                  className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-200/50 p-4"
                >
                  <ProposalPreview ref={previewRef} data={data} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
