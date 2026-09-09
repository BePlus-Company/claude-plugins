# BePlus Claude plugins

Marketplace de plugins do Claude Code da BePlus. Dois plugins, um manifesto.

| Plugin | O que faz | Transporte |
|---|---|---|
| `beplus` | 24 ferramentas do IA Lab: imagem, vídeo, áudio, música, upscale, calls, projetos e clientes | stdio, servidor empacotado no plugin |
| `intelligence-hub` | Radar de tendências, dossiês de cliente e base de conhecimento | HTTP, direto no backend |

Instalação em [INSTALL.md](INSTALL.md). Roteiro para agente em [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md).

## Peça para o Claude instalar

Cole numa sessão do Claude Code e ele resolve sozinho.

### Central de Inteligência

Login pelo navegador, sem token para copiar.

> Instala a Central de Inteligência da BePlus aqui.
>
> 1. Rode: `claude mcp add --transport http --scope user intelligence-hub https://api-fanclub.squareweb.app/mcp`
> 2. Rode: `script -q /dev/null claude mcp login intelligence-hub`
>    Abre o navegador. Eu faço o login e autorizo.
> 3. Quando o passo 2 terminar, rode `claude mcp list` e leia a linha do intelligence-hub.
>
> Não passe header, chave nem token.
>
> No fim, responda só duas coisas: se conectou, e que eu preciso reiniciar o Claude Code para usar as ferramentas. Não comente outros servidores da lista, não sugira investigar nada, e não repita o que já está nos comandos acima.

O `script -q /dev/null` não é enfeite: sem ele o `claude mcp login` morre com
`stdin isn't a terminal`, porque a ferramenta Bash do agente não é um TTY.
No Linux a forma é `script -qec "claude mcp login intelligence-hub" /dev/null`.

### IA Lab

O IA Lab é MCP stdio, e a spec de autorização do MCP diz para stdio não usar
OAuth e ler credencial do ambiente. Por isso aqui ainda tem token, mas o Claude
Code pergunta por ele em vez de você editar arquivo.

> Instala o BePlus aqui pra eu gerar imagem e vídeo.
>
> 1. Rode: `claude plugin marketplace add BePlus-Company/claude-plugins`
> 2. Rode: `claude plugin install beplus@beplus`
> 3. Rode `claude plugin details beplus` e leia a linha "MCP servers". Tem que ser (1), não (0).
>
> Depois disso eu rodo `/plugin configure beplus@beplus` e colo o token, que é um slash command que só eu posso digitar.
>
> No fim, responda só se os 3 passos deram certo. Não comente outros servidores nem sugira investigar nada.

O passo 3 não é enfeite: o `install` responde `Successfully installed` mesmo
quando o servidor MCP não registrou. `claude plugin details` é o único lugar que
mostra a verdade.

### Ou, na mão

```bash
# Central de Inteligência
claude mcp add --transport http --scope user intelligence-hub https://api-fanclub.squareweb.app/mcp
claude mcp login intelligence-hub

# IA Lab
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
