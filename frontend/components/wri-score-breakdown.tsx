interface WriCheckItem {
  category: string;
  key: string;
  value: number;
  weight: number;
}

interface WriScoreBreakdownProps {
  score: number;
  checks: WriCheckItem[];
}

export function WriScoreBreakdown({ score, checks }: WriScoreBreakdownProps) {
  return (
    <div>
      <p className="mb-3 text-4xl font-bold text-[var(--wk-primary)]">
        {score}
        <span className="text-base font-normal text-white/50">/100</span>
      </p>
      <ul className="space-y-1 text-sm text-white/70">
        {checks.map((check) => (
          <li key={`${check.category}-${check.key}`}>
            [{check.category}] {check.key}: {check.value ? '✅' : '❌'}
          </li>
        ))}
      </ul>
    </div>
  );
}
