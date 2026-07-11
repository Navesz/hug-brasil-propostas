"use client";

import { useState } from "react";
import {
  BookmarkPlus,
  Copy,
  FolderOpen,
  LayoutTemplate,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { PropostaSalva, PropostaSolar } from "@/types/proposal";
import {
  carregarProposta,
  excluirProposta,
  listarPropostas,
  salvarProposta,
} from "@/lib/storage";
import {
  aplicarModelo,
  excluirModelo,
  listarModelos,
  salvarModelo,
} from "@/lib/templates";

interface ProposalToolbarProps {
  data: PropostaSolar;
  onLoad: (data: PropostaSolar) => void;
  onNew: () => void;
  onDuplicate: () => void;
  lastSaved?: string;
}

export function ProposalToolbar({
  data,
  onLoad,
  onNew,
  onDuplicate,
  lastSaved,
}: ProposalToolbarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [history, setHistory] = useState<PropostaSalva[]>([]);
  const [modelos, setModelos] = useState(listarModelos());

  const refreshHistory = () => setHistory(listarPropostas());
  const refreshModelos = () => setModelos(listarModelos());

  const handleSave = async () => {
    try {
      const saved = await salvarProposta(data);
      onLoad(saved.data);
      refreshHistory();
    } catch {
      alert("Erro ao salvar proposta. Tente novamente.");
    }
  };

  const handleSalvarModelo = () => {
    const nome = prompt("Nome do modelo:", "Meu modelo padrão");
    if (!nome?.trim()) return;
    salvarModelo(nome.trim(), data);
    refreshModelos();
    setShowTemplates(true);
    setShowHistory(false);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-1.5 rounded-lg bg-hug-blue px-3 py-2 text-sm font-medium text-white transition hover:brightness-110"
      >
        <Save className="h-4 w-4" />
        Salvar
      </button>

      <button
        type="button"
        onClick={() => {
          refreshHistory();
          setShowHistory(!showHistory);
          setShowTemplates(false);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <FolderOpen className="h-4 w-4" />
        Histórico
      </button>

      <button
        type="button"
        onClick={() => {
          refreshModelos();
          setShowTemplates(!showTemplates);
          setShowHistory(false);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <LayoutTemplate className="h-4 w-4" />
        Modelos
      </button>

      <button
        type="button"
        onClick={handleSalvarModelo}
        className="flex items-center gap-1.5 rounded-lg border border-hug-green/40 bg-hug-green/5 px-3 py-2 text-sm font-medium text-hug-green transition hover:bg-hug-green/10"
      >
        <BookmarkPlus className="h-4 w-4" />
        Salvar modelo
      </button>

      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        Nova
      </button>

      <button
        type="button"
        onClick={onDuplicate}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Copy className="h-4 w-4" />
        Duplicar
      </button>

      {lastSaved && (
        <span className="ml-auto text-xs text-slate-400">
          Rascunho salvo {lastSaved}
        </span>
      )}

      {showHistory && (
        <div className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Propostas salvas
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma proposta salva ainda.</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    onClick={async () => {
                      const loaded = await carregarProposta(item.id);
                      if (loaded) onLoad(loaded);
                      setShowHistory(false);
                    }}
                    className="flex-1 text-left hover:text-hug-blue"
                  >
                    <span className="font-medium">{item.nome}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {new Date(item.updatedAt).toLocaleString("pt-BR")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      excluirProposta(item.id);
                      refreshHistory();
                    }}
                    className="ml-2 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showTemplates && (
        <div className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Meus modelos
          </p>
          {modelos.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhum modelo salvo. Use &quot;Salvar modelo&quot; para criar um a partir da
              proposta atual.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {modelos.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLoad(aplicarModelo(m.id));
                      setShowTemplates(false);
                    }}
                    className="flex-1 text-left hover:text-hug-blue"
                  >
                    <span className="font-medium">{m.nome}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {new Date(m.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      excluirModelo(m.id);
                      refreshModelos();
                    }}
                    className="ml-2 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
