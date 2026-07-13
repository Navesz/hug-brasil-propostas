const https = require("https");

const ACCESS_CONFIG_URL =
  process.env.ACCESS_CONFIG_URL ??
  "https://raw.githubusercontent.com/Navesz/hug-brasil-propostas/main/config/access.json";

const DEFAULT_MESSAGE =
  "Este aplicativo foi desativado. Entre em contato com a HUG BRASIL para mais informações.";

function fail(message) {
  console.error(message);
  process.exit(1);
}

https
  .get(ACCESS_CONFIG_URL, { timeout: 10_000 }, (response) => {
    if (response.statusCode !== 200) {
      fail("Nao foi possivel verificar o acesso. Verifique sua conexao com a internet.");
    }

    let body = "";
    response.on("data", (chunk) => {
      body += chunk;
    });
    response.on("end", () => {
      try {
        const config = JSON.parse(body);
        if (config.enabled !== true) {
          fail(config.message || DEFAULT_MESSAGE);
        }
        process.exit(0);
      } catch {
        fail("Resposta de acesso invalida.");
      }
    });
  })
  .on("timeout", () => {
    fail("Tempo esgotado ao verificar o acesso. Verifique sua conexao com a internet.");
  })
  .on("error", () => {
    fail("Nao foi possivel verificar o acesso. Verifique sua conexao com a internet.");
  });
