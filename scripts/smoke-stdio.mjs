// Handshake JSON-RPC por stdio contra o server vendorizado do beplus.
// Prova que o bundle sobe e devolve as 24 tools sem tocar na rede.
// Uso: node scripts/smoke-stdio.mjs [caminho/do/index.js]

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_TOOL_COUNT = 24;
const HANDSHAKE_TIMEOUT_MS = 30_000;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = resolve(
  process.argv[2] ?? resolve(repoRoot, 'plugins/beplus/server/index.js'),
);

if (!existsSync(serverPath)) {
  console.error(`erro: server nao encontrado em ${serverPath}`);
  console.error('rode scripts/vendor-server.sh antes, ou passe o caminho como argumento.');
  process.exit(1);
}

const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  // Token de fachada: tools/list nao chama a API, so o handshake importa.
  env: { ...process.env, BEPLUS_API_TOKEN: 'smoke-test-token' },
});

let stdout = '';
let stderr = '';
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
});
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});

const timer = setTimeout(() => {
  child.kill('SIGKILL');
  fail(`timeout de ${HANDSHAKE_TIMEOUT_MS}ms sem resposta do server`);
}, HANDSHAKE_TIMEOUT_MS);

function fail(message) {
  clearTimeout(timer);
  console.error(`FALHOU: ${message}`);
  if (stderr.trim()) console.error(`stderr do server:\n${stderr.trim()}`);
  process.exit(1);
}

function send(payload) {
  child.stdin.write(`${JSON.stringify(payload)}\n`);
}

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'beplus-claude-plugins-smoke', version: '0.1.0' },
  },
});
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

child.on('error', (error) => fail(`nao consegui iniciar o server: ${error.message}`));

child.on('close', (code) => {
  clearTimeout(timer);
  const responses = new Map();
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const message = JSON.parse(line);
      if (message.id != null) responses.set(message.id, message);
    } catch {
      // Linha de log solta no stdout nao invalida o handshake.
    }
  }

  const initialize = responses.get(1);
  if (!initialize?.result?.serverInfo) {
    return fail(`initialize nao respondeu (exit ${code})`);
  }

  const toolsList = responses.get(2);
  const tools = toolsList?.result?.tools;
  if (!Array.isArray(tools)) {
    return fail(`tools/list nao respondeu (exit ${code})`);
  }
  if (tools.length !== EXPECTED_TOOL_COUNT) {
    return fail(
      `esperava ${EXPECTED_TOOL_COUNT} tools, veio ${tools.length}: ${tools
        .map((tool) => tool.name)
        .join(', ')}`,
    );
  }

  const { name, version } = initialize.result.serverInfo;
  console.log(`OK server=${name} version=${version} tools=${tools.length}`);
  console.log(tools.map((tool) => tool.name).join(', '));
  process.exit(0);
});

// tools/list ja respondeu quando o stdin fecha; o server encerra sozinho.
child.stdin.end();
