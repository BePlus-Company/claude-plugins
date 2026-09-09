# BePlus Claude plugins

Marketplace de plugins do Claude Code da BePlus. Dois plugins, um manifesto.

| Plugin | O que faz | Transporte |
|---|---|---|
| `beplus` | 24 ferramentas do IA Lab: imagem, vídeo, áudio, música, upscale, calls, projetos e clientes | stdio, servidor empacotado no plugin |
| `intelligence-hub` | Radar de tendências, dossiês de cliente e base de conhecimento | HTTP, direto no backend |

Instalação em [INSTALL.md](INSTALL.md). Roteiro para agente em [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md).

```bash
claude plugin marketplace add BePlus-Company/claude-plugins
claude plugin install beplus@beplus --config api_token=SEU_TOKEN
```

## Estrutura

```
.claude-plugin/marketplace.json   catálogo: nome, dono, e os dois plugins
plugins/beplus/                   plugin do IA Lab
  .claude-plugin/plugin.json      metadados + userConfig do token
  .mcp.json                       o servidor stdio
  server/index.js                 bundle do beplus-mcp, versionado no repo
plugins/intelligence-hub/         plugin do hub
  .claude-plugin/plugin.json      metadados + userConfig da chave
  .mcp.json                       o servidor HTTP
scripts/vendor-server.sh          copia o bundle do beplus-mcp para server/
scripts/smoke-stdio.mjs           handshake JSON-RPC, exige as 24 tools
```

## Armadilhas que este repo já pagou

Quatro coisas passam em `claude plugin validate --strict` e mesmo assim não funcionam.
Cada uma custou um ciclo de depuração, então estão registradas aqui.

1. **`skills` e `commands` no `marketplace.json` são array de string, nunca objeto.**
   Um array de objetos derruba a validação com `plugins.0.skills: Invalid input`, e o
   `/plugin install` falha.

2. **`userConfig` no `marketplace.json` é aceito pelo validador e ignorado pelo runtime.**
   O `claude plugin install --config` responde `plugin declares no userConfig options`.
   O campo tem que estar no `plugin.json` de cada plugin.

3. **`mcpServers` como objeto inline no `plugin.json` valida e não registra servidor nenhum.**
   O inventário sai `MCP servers (0)`. Só funciona como caminho de arquivo,
   `"mcpServers": "./.mcp.json"`. Verificado na CLI 2.1.266.

4. **Declarar `commands` ou `agents` substitui o diretório padrão, não soma.** Só `skills` soma.
   Não declare o que você não usa.

E uma quinta, de operação: o nome da skill vem do frontmatter `name`, não do nome do diretório.
Sem ele, um plugin instalado por marketplace cai numa string de versão que muda a cada update.

## Desenvolvimento

```bash
claude plugin validate . --strict     # tem que sair "✔ Validation passed"
bash scripts/vendor-server.sh         # copia o bundle do beplus-mcp
node scripts/smoke-stdio.mjs          # handshake, tem que sair "tools=24"
```

O CI roda os dois em ubuntu, macos e windows.
