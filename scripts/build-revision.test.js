import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('only a full lowercase trusted CI revision is compiled into both targets', () => {
  const script = fileURLToPath(new URL('./build-revision.mjs', import.meta.url));
  const eslint = fileURLToPath(new URL('../node_modules/eslint/bin/eslint.js', import.meta.url));
  const generate = (env) => {
    const result = spawnSync(process.execPath, [script], { env, timeout: 10_000 });
    assert.equal(result.status, 0);
  };
  try {
    for (const revision of ['a'.repeat(40), 'A'.repeat(40), 'abcdef', '', 'a'.repeat(40) + '\n', undefined]) {
      const env = { ...process.env, VITE_BUILD_REVISION: 'b'.repeat(40) };
      if (revision === undefined) delete env.GITHUB_SHA;
      else env.GITHUB_SHA = revision;
      generate(env);
      const sources = ['shared/src', 'web/src/lib'].map((directory) => readFileSync(new URL(`../${directory}/build-revision.generated.ts`, import.meta.url), 'utf8'));
      assert.equal(sources[0], sources[1]);
      assert.ok(sources[0].includes(revision === 'a'.repeat(40) ? revision : '= undefined;'));
      assert.ok(!sources[0].includes('b'.repeat(40)));
      // Exercise each workspace's real rules, without --fix hiding bad output.
      // Other malformed values above produce the same undefined module.
      if (revision === 'a'.repeat(40) || revision === 'A'.repeat(40) || revision === undefined) {
        for (const [workspace, path] of [['shared', 'src/build-revision.generated.ts'], ['web', 'src/lib/build-revision.generated.ts']]) {
          const result = spawnSync(process.execPath, [eslint, path, '--no-cache', '--max-warnings', '0'], {
            cwd: fileURLToPath(new URL(`../${workspace}/`, import.meta.url)),
            encoding: 'utf8',
            timeout: 30_000,
          });
          assert.equal(result.status, 0, `${workspace} generated revision lint failed:\n${result.stdout}\n${result.stderr}`);
        }
      }
    }
  } finally {
    generate(process.env);
  }
});
