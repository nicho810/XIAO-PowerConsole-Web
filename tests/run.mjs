/**
 * [INPUT]: Vite 编译能力、Node 临时目录与测试运行器
 * [OUTPUT]: npm test 的退出码；编译产物仅写临时目录并在结束后清理
 * [POS]: tests/ 的免额外依赖运行入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { build } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const output = await mkdtemp(join(tmpdir(), 'powerconsole-tests-'));
try {
  await build({
    configFile: false,
    logLevel: 'error',
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    build: {
      ssr: fileURLToPath(new URL('./core.test.ts', import.meta.url)),
      target: 'node22',
      outDir: output,
      rollupOptions: { output: { entryFileNames: 'core.test.mjs' } },
    },
  });
  process.exitCode = spawnSync(process.execPath, ['--test', join(output, 'core.test.mjs')], { stdio: 'inherit' }).status ?? 1;
} finally {
  await rm(output, { recursive: true, force: true });
}
