# HUG BRASIL — Gerador de Propostas Solares

Aplicação web para criar propostas comerciais de energia solar (On-Grid, Off-Grid e Híbrido), com preview em tempo real, gráficos e exportação em PDF.

## Requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado: 20+)
- npm (já vem com o Node.js)
- Git é **opcional** (só se quiser clonar; dá para baixar em ZIP)

## Como rodar no seu computador

### Opção A — Sem Git (mais simples)

1. Abra: https://github.com/Navesz/hug-brasil-propostas
2. Clique no botão verde **Code** → **Download ZIP**
3. Extraia a pasta `hug-brasil-propostas` no computador
4. Abra o terminal/prompt **dentro dessa pasta** e rode:

```bash
npm install
npm run dev
```

5. Abra no navegador: **http://localhost:3000**

### Opção B — Com Git

```bash
git clone https://github.com/Navesz/hug-brasil-propostas.git
cd hug-brasil-propostas
npm install
npm run dev
```

Abra no navegador: **http://localhost:3000**

### Windows (sem terminal avançado)

1. Baixe o ZIP pelo link acima e extraia
2. Entre na pasta do projeto
3. Na barra de endereço do Explorer, digite `cmd` e Enter
4. Digite `npm install` e depois `npm run dev`

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (localhost) |
| `npm run build` | Gera build de produção |
| `npm run start` | Roda a build de produção |
| `npm run dev:network` | Dev acessível na rede local (0.0.0.0:3000) |
| `npm run start:network` | Produção acessível na rede local |
| `npm run tunnel` | Túnel Cloudflare (acesso externo temporário) |

## Funcionalidades

- Formulário completo: cliente, sistema, equipamentos, financeiro
- Cálculo automático de kWp e geração a partir de placas × watts
- Calculadora avançada (perdas, fator kWp/ano, payback)
- Suporte On-Grid, Off-Grid e Híbrido
- Múltiplos kits por proposta
- Gráficos de geração mensal, economia e payback
- Exportação PDF (com ou sem valores)
- Salvar/carregar propostas no navegador (localStorage)
- Modelos prontos (residencial, comercial, híbrido, off-grid)

## Tecnologias

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS 4
- Recharts, jsPDF, html2canvas

## Observações

- Os dados das propostas ficam salvos no **navegador** (localStorage), não em servidor.
- Para compartilhar o site na internet, use `npm run tunnel` ou hospede em Vercel/Netlify.

---

**HUG BRASIL Energia Solar**
