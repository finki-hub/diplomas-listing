import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('only a full lowercase trusted CI revision is compiled into both targets', () => {
  const script = fileURLToPath(new URL('./build-revision.mjs', import.meta.url));
  const generate = (env) => {
    const result = spawnSync(process.execPath, [script], { env, timeout: 10_000 });
    assert.equal(result.status, 0);
  };
  try {
    for (const revision of ['a'.repeat(40), 'A'.repeat(40), 'abcdef', '', 'a'.repeat(40) + '\n']) {
      generate({ ...process.env, GITHUB_SHA: revision, VITE_BUILD_REVISION: 'b'.repeat(40) });
      const sources = ['shared/src', 'web/src/lib'].map((directory) => readFileSync(new URL(`../${directory}/build-revision.generated.ts`, import.meta.url), 'utf8'));
      assert.equal(sources[0], sources[1]);
      assert.ok(sources[0].includes(revision === 'a'.repeat(40) ? JSON.stringify(revision) : '= undefined;'));
      assert.ok(!sources[0].includes('b'.repeat(40)));
    }
  } finally {
    generate(process.env);
  }
});
