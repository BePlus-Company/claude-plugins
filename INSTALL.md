# Instalação

Dois plugins, um marketplace. O que você instala aqui substitui o método antigo por `npx`,
e resolve de uma vez os três problemas que faziam a instalação falhar: o caminho absoluto
do executável, o token pedido na hora certa, e nenhum JSON editado na mão.

Requisito: Claude Code 2.1.266 ou mais novo. Confira com `claude --version`.

## 1. Adicione o marketplace

```bash
claude plugin marketplace add BePlus-Company/claude-plugins
```

## 2. Pegue a sua chave

| Plugin | Onde gerar |
|---|---|
| `beplus` | Painel da BePlus, em "Tokens de acesso" |
| `intelligence-hub` | Painel do hub, em "Perfil", seção "Conectores". A chave começa com `ih_mcp_` |

A chave é pessoal e revogável. Ela fica guardada pelo Claude Code, não em texto claro dentro
da pasta de configuração.

## 3. Instale

```bash
claude plugin install beplus@beplus --config api_token=SEU_TOKEN
claude plugin install intelligence-hub@beplus --config api_token=SUA_CHAVE_ih_mcp
```

Se preferir digitar a chave numa caixa em vez de colar no terminal, instale sem o `--config`
e depois rode `/plugin configure beplus@beplus` dentro do Claude Code.

## 4. Reinicie o Claude Code

Servidor MCP só sobe no começo da sessão. Sem reiniciar, as ferramentas não aparecem.

## 5. Confirme

```bash
claude plugin details beplus@beplus
```

A linha do inventário tem que dizer `MCP servers (1)  beplus`. Depois, dentro de uma sessão
nova, peça para chamar a ferramenta `whoami`. Ela responde com o e-mail da sua conta e o
saldo de diamantes.

## O que cada plugin traz

**beplus**: 24 ferramentas do IA Lab. Gera imagem, vídeo, áudio e música, faz upscale, lê
metadados de mídia, estima custo, e consulta calls, projetos e clientes da sua conta.
Roda por stdio, com o servidor empacotado dentro do próprio plugin.

**intelligence-hub**: radar de tendências, dossiês de cliente e base de conhecimento.
Conecta por HTTP direto no backend, sem Node no meio.

## Checklist do Windows

Rode estas seis linhas no PowerShell e compare com o esperado. Elas cobrem o caminho inteiro,
do zero até a ferramenta respondendo.

```powershell
claude --version                                                    # 1. sai 2.1.266 ou mais novo
claude plugin marketplace add BePlus-Company/claude-plugins          # 2. sai "Successfully added marketplace: beplus"
claude plugin install beplus@beplus --config api_token=SEU_TOKEN     # 3. sai "Successfully installed plugin: beplus@beplus"
claude plugin details beplus@beplus                                  # 4. o inventário tem que dizer "MCP servers (1)  beplus"
node --version                                                       # 5. precisa ser v18 ou mais novo, é o node que roda o servidor
dir "$env:LOCALAPPDATA\claude-cli-nodejs"                            # 6. se algo falhar, o log cru está aqui
```

Depois reinicie o Claude Code e peça para chamar `whoami`.

Se o passo 3 reclamar de `npx`, ignore qualquer instrução antiga que mande usar `npx` ou
`cmd /c npx`. Este plugin não usa `npx` em nenhum momento, justamente porque no Windows o
`npx` é um `.cmd` que o spawn do Node não resolve sem shell.

## Quando algo dá errado

A tabela completa de sintoma e ação está em [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md),
no fim do arquivo. Ela serve para pessoa também.
