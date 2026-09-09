# Install for agents

Você é um agente de código. O usuário pediu para instalar os plugins da BePlus no Claude Code.
Siga exatamente os passos abaixo, na ordem. Cada passo tem uma linha `Verify:` com a saída
literal esperada. Se a saída não bater, vá para a tabela de erros no fim do arquivo.

Não improvise comando. Não edite `~/.claude.json` nem `settings.json` na mão: o plugin escreve
tudo sozinho, e é justamente isso que ele existe para resolver.

## Passo 1. Confirme a versão do Claude Code

```bash
claude --version
```

Verify: sai `2.1.266 (Claude Code)` ou mais novo. Os plugins foram validados na 2.1.266.
Se a versão for mais antiga, atualize antes de continuar: `claude update`.

## Passo 2. Adicione o marketplace

```bash
claude plugin marketplace add BePlus-Company/claude-plugins
```

Verify: sai exatamente

```
✔ Successfully added marketplace: beplus (declared in user settings)
```

## Passo 3. Peça o token ao usuário

O plugin `beplus` precisa de um Personal Access Token, gerado no painel da BePlus em
"Tokens de acesso". O plugin `intelligence-hub` precisa de uma chave `ih_mcp_...`, gerada
no painel do hub em "Perfil", seção "Conectores".

Pergunte ao usuário qual dos dois ele quer, e peça a chave correspondente. Não invente,
não reaproveite chave de outro serviço, e não siga adiante sem ela.

## Passo 4. Instale o plugin do IA Lab

Troque `COLE_O_TOKEN_AQUI` pelo token que o usuário passou.

```bash
claude plugin install beplus@beplus --config api_token=COLE_O_TOKEN_AQUI
```

Verify: sai exatamente

```
Installing plugin "beplus@beplus"...✔ Successfully installed plugin: beplus@beplus (scope: user)
```

Se aparecer a linha `1 userConfig option not yet set`, o `--config` não foi aplicado.
Veja a tabela de erros.

## Passo 5. Instale o plugin do Intelligence Hub

Só rode este passo se o usuário pediu o hub também.

```bash
claude plugin install intelligence-hub@beplus --config api_token=COLE_A_CHAVE_ih_mcp_AQUI
```

Verify: sai exatamente

```
Installing plugin "intelligence-hub@beplus"...✔ Successfully installed plugin: intelligence-hub@beplus (scope: user)
```

## Passo 6. Confirme que o servidor MCP foi registrado

```bash
claude plugin details beplus@beplus
```

Verify: no bloco `Component inventory`, a linha do MCP tem que ser

```
  MCP servers (1)  beplus  (tool schemas resolved at runtime; not counted)
```

Se sair `MCP servers (0)`, o plugin instalou mas não registrou o servidor.
Veja a tabela de erros.

## Passo 7. Prove que conecta de verdade

Peça ao usuário para reiniciar o Claude Code, porque servidor MCP só sobe no início da sessão.
Depois, na sessão nova, chame a ferramenta `whoami` do beplus.

Verify: a resposta traz o e-mail da conta e o saldo de diamantes. Se vier erro de token,
a chave está errada ou foi revogada.

## Passo 8. Encerre

Diga ao usuário que está instalado e dê dois exemplos de uso: gerar uma imagem pelo IA Lab,
e consultar uma call. Não explique estrutura de pasta, caminho de cache nem nome de arquivo
interno. Ele não precisa disso.

## Tabela de erros

| Sintoma | O que é | O que fazer |
|---|---|---|
| `spawn npx ENOENT`, ou `command not found: npx`, num app aberto pelo Finder (Claude Desktop, Cursor) | App aberto pelo Finder não herda o PATH do shell. Confirme com `launchctl getenv PATH`: se voltar vazio, o app não enxerga `/opt/homebrew/bin`, e é lá que o `npx` do Homebrew mora | Não use `npx`. É exatamente o problema que este plugin resolve: ele chama `node` com caminho absoluto via `${CLAUDE_PLUGIN_ROOT}`. Refaça a instalação pelos passos 2 a 5 |
| `npm error could not determine executable to run` | Cache do `npx` corrompido, comum depois de uma instalação interrompida | `rm -rf ~/.npm/_npx` e tente de novo |
| `⚠ Installed, but --config not applied: --config key "X" isn't declared in this plugin's userConfig` | Nome de campo errado | O campo é `api_token` nos dois plugins. A própria mensagem lista as chaves válidas |
| `1 userConfig option not yet set` | O token não entrou | Rode `claude plugin install <plugin>@beplus --config api_token=...` de novo, ou, numa sessão interativa, `/plugin configure <plugin>@beplus` |
| `MCP servers (0)` no passo 6 | O manifesto não registrou o servidor | Confirme que `plugins/<plugin>/.claude-plugin/plugin.json` tem `"mcpServers": "./.mcp.json"`, apontando para um arquivo. Objeto inline nesse campo passa na validação e não registra nada |
| HTTP 401, ou `Token inválido ou expirado` | Chave revogada, expirada, ou de outro ambiente | Gere uma chave nova no painel e refaça o passo 4 ou 5. Nunca edite o JSON na mão para "consertar" |
| HTTP 404 ou 405 no `intelligence-hub` | A URL não é um endpoint MCP | A URL correta é `https://api-fanclub.squareweb.app/mcp`. Confirme que o backend está no ar |
| O servidor não aparece na sessão | Servidor MCP só sobe no início da sessão | Reinicie o Claude Code |
| Precisa ver o erro cru do servidor | Log por sessão, um JSONL por conexão | `ls ~/Library/Caches/claude-cli-nodejs/<projeto-com-barras-viradas-em-hifen>/mcp-logs-plugin-<plugin>-<servidor>/`. Para o beplus: `mcp-logs-plugin-beplus-beplus`. Se não souber o nome da pasta do projeto: `ls -d ~/Library/Caches/claude-cli-nodejs/*/mcp-logs-plugin-*` |

No Windows o caminho dos logs é `%LOCALAPPDATA%\claude-cli-nodejs\`, com a mesma estrutura
de subpastas.
