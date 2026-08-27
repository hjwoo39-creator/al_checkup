export const SCORE_COLORS = {
  good: '#3BBB92',
  danger: '#EF4A63',
  neutral: '#0878F9',
};

const FACTOR_THRESHOLDS = {
  guilt: { threshold: 24, positive: true },
  overconfidence: { threshold: 15, positive: false },
  miscalculation: { threshold: 10, positive: false },
  internal_attr: { threshold: 13, positive: true },
  external_attr: { threshold: 13, positive: false },
  self_control: { threshold: 9, positive: true },
  impulsiveness: { threshold: 17, positive: false },
  sensation_seeking: { threshold: 24, positive: false },
  morality: { threshold: 19, positive: true },
};

export function getScoreColor(factor, score) {
  const cfg = FACTOR_THRESHOLDS[factor];
  const value = Number(score);
  if (!cfg || !Number.isFinite(value)) return SCORE_COLORS.neutral;

  if (cfg.positive) {
    return value >= cfg.threshold ? SCORE_COLORS.good : SCORE_COLORS.danger;
  } else {
    return value < cfg.threshold ? SCORE_COLORS.good : SCORE_COLORS.danger;
  }
}

export function getLevelColor(level) {
  if (level === '양호') return SCORE_COLORS.good;
  if (level === '주의') return SCORE_COLORS.danger;
  return SCORE_COLORS.neutral;
}
