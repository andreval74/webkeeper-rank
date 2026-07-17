import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface EnvFileSpec {
  path: string;
  required: string[];
}

const root = join(__dirname, '..');

const specs: EnvFileSpec[] = [
  { path: join(root, 'backend', '.env'), required: ['DATABASE_URL', 'JWT_SECRET'] },
  { path: join(root, 'frontend', '.env.local'), required: ['NEXT_PUBLIC_API_URL'] },
];

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    result[key] = rest.join('=').trim().replace(/^"|"$/g, '');
  }
  return result;
}

let hasError = false;

for (const spec of specs) {
  console.log(`\nVerificando ${spec.path.replace(root, '.')}`);

  if (!existsSync(spec.path)) {
    console.log(`  ✗ arquivo não encontrado. Copie o .env.example correspondente.`);
    hasError = true;
    continue;
  }

  const values = parseEnv(readFileSync(spec.path, 'utf-8'));

  for (const key of spec.required) {
    const value = values[key];
    const filled = value && value !== 'change-me' && !value.includes('user:password');
    console.log(`  ${filled ? '✓' : '✗'} ${key}`);
    if (!filled) hasError = true;
  }
}

if (hasError) {
  console.log('\nAlgumas variáveis obrigatórias ainda não foram preenchidas.');
  process.exit(1);
} else {
  console.log('\nTodas as variáveis obrigatórias estão preenchidas.');
}
