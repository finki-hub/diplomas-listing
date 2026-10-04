import { writeFileSync } from 'node:fs';

// GitHub Actions supplies this to both existing reusable deploy workflows.
// Never use request headers, VITE_* overrides, or a mutable browser global.
const revision = process.env.GITHUB_SHA?.length === 40 && /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA)
  ? process.env.GITHUB_SHA
  : undefined;
const source = `// Generated at build time.\nexport const BUILD_REVISION: string | undefined = ${JSON.stringify(revision) ?? 'undefined'};\n`;
for (const path of ['shared/src/build-revision.generated.ts', 'web/src/lib/build-revision.generated.ts']) {
  writeFileSync(new URL(`../${path}`, import.meta.url), source);
}
