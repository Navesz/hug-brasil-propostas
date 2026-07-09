export type TipoSistema = "on-grid" | "off-grid" | "hibrido";
export type TipoLigacao = "monofasico" | "bifasico" | "trifasico";
export type TipoRede = "residencial" | "comercial" | "rural";

export interface KitSistema {
  id: string;
  titulo: string;
  descricao: string;
  potenciaKwp: string;
  quantidadePlacas: string;
  potenciaPlacaW: string;
  modeloPlacas: string;
  garantiaPlacas: string;
  quantidadeInversores: string;
  modeloInversor: string;
  garantiaInversor: string;
  modeloInversorHibrido: string;
  garantiaInversorHibrido: string;
  modeloInversorOngrid: string;
  garantiaInversorOngrid: string;
  bateria: string;
  garantiaBateriaCiclos: string;
  garantiaBateriaAnos: string;
  geracaoMediaMensal: string;
  economiaMediaMensal: string;
  estruturas: string;
  acessorios: string;
  investimento: string;
}

export type ModoConsumo = "media" | "mensal";

export interface PropostaSolar {
  id: string;
  logoUrl: string;
  numeroOrcamento: string;
  dataProposta: string;
  validadeProposta: string;

  nomeCliente: string;
  unidades: string;
  enderecoInstalacao: string;

  tipoSistema: TipoSistema;
  tipoLigacao: TipoLigacao;
  tipoRede: TipoRede;
  tensaoRede: string;
  concessionaria: string;
  consumoMedio12Meses: string;
  consumoMensalDetalhado: string[];
  modoConsumo: ModoConsumo;
  /** @deprecated use modoConsumo */
  usarConsumoDetalhado: boolean;
  reducaoConta: string;
  valorKwh: string;
  perdasSistema: string;
  fatorGeracaoKwp: string;
  percentualGeracao: string;
  simultaneidade: string;
  considerarTusdG: boolean;
  irradiacaoLocal: string;

  kits: KitSistema[];

  geracaoAnual: string;
  percentualCobertura: string;

  investimentoTotal: string;
  investimentoMateriais: string;
  investimentoServicos: string;
  percentualMateriais: string;
  percentualServicos: string;
  custoReferenciaKwp: string;
  custoPorWp: string;
  payback: string;
  aumentoAnualEnergia: string;
  perdaPotenciaAnual: string;

  garantiaModulo: string;
  garantiaInversorServico: string;
  garantiaServicos: string;
  certificacaoInmetro: string;
  notaTecnicaModulo: string;

  formasPagamento: {
    transferencia: boolean;
    cartao: boolean;
    boleto: boolean;
    financiamento: boolean;
    pix: boolean;
  };

  ocultarValores: boolean;

  observacoes: string;
  observacoesFinanciamento: string;
  descricaoProjeto: string;

  empresaNome: string;
  empresaCnpj: string;
  empresaContato: string;
  empresaEndereco: string;
  empresaSite: string;
  representanteNome: string;
  representanteCnpj: string;
}

export interface PropostaSalva {
  id: string;
  nome: string;
  cliente: string;
  numeroOrcamento: string;
  updatedAt: string;
  data: PropostaSolar;
}
