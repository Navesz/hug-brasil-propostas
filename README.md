# HUG BRASIL — Gerador de Propostas Solares

Aplicação web para criar propostas comerciais de energia solar (On-Grid, Off-Grid e Híbrido), com preview em tempo real, gráficos e exportação em PDF.

## Requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado: 20+)
- npm (já vem com o Node.js)
- Git é **opcional** (só se quiser clonar; dá para baixar em ZIP)

## Como rodar no seu computador

### Windows com Chocolatey (recomendado — sem Git)

Abra o **PowerShell ou Prompt de Comando como Administrador** e siga os passos abaixo.

**Passo 1 — Instalar o Node.js** (se ainda não tiver):

```powershell
choco install nodejs-lts -y
```

Feche e abra o terminal de novo. Confira se instalou:

```powershell
node -v
npm -v
```

**Passo 2 — Baixar o projeto** (não precisa de Git):

1. Abra: https://github.com/Navesz/hug-brasil-propostas
2. Clique no botão verde **Code** → **Download ZIP**
3. Extraia a pasta `hug-brasil-propostas` (ex.: em `C:\Users\SeuNome\Downloads\hug-brasil-propostas`)

**Passo 3 — Instalar e rodar** (terminal normal, dentro da pasta do projeto):

```powershell
cd C:\Users\SeuNome\Downloads\hug-brasil-propostas
npm install
npm run dev
```

Troque o caminho acima pelo local onde você extraiu a pasta.

**Passo 4 — Abrir no navegador:** http://localhost:3000

Para parar o site, pressione `Ctrl + C` no terminal.

---

### Opção A — Sem Git (download ZIP)

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

Se quiser usar Git, pode instalar com Chocolatey:

```powershell
choco install git -y
```

Depois:

```bash
git clone https://github.com/Navesz/hug-brasil-propostas.git
cd hug-brasil-propostas
npm install
npm run dev
```

Abra no navegador: **http://localhost:3000**

### Windows (sem Chocolatey)

1. Instale o Node.js em https://nodejs.org/ (versão LTS)
2. Baixe o ZIP em https://github.com/Navesz/hug-brasil-propostas
3. Extraia a pasta do projeto
4. Na barra de endereço do Explorer, digite `cmd` e Enter
5. Digite `npm install` e depois `npm run dev`

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

## Controle remoto de acesso

O aplicativo verifica online se está autorizado a funcionar. O controle fica no arquivo `config/access.json` do repositório no GitHub.

**Para desativar remotamente** (em qualquer computador que tenha o app):

1. Edite `config/access.json` no GitHub
2. Mude `"enabled": true` para `"enabled": false`
3. Opcionalmente altere a `"message"` exibida ao usuário
4. Faça commit na branch `main`

Na próxima abertura do app (ou em até 5 minutos, se já estiver aberto), o acesso será bloqueado. Sem internet, o app também não abre.

O script `atualizar-e-iniciar.bat` também faz essa verificação antes de iniciar o servidor. Ele usa a pasta onde o `.bat` está salvo, então funciona em qualquer computador (requer Node.js e Git instalados).

---

**HUG BRASIL Energia Solar**
