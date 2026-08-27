import os from 'os';
import { ALL_QUESTIONS } from '../data/questions.js';
import { calculateAllResults, getOverallType, TYPE_DETAILS } from '../data/resultRules.js';

export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, address: iface.address });
      }
    }
  }

  const wifi = candidates.find((c) => /wi-?fi|wlan|wireless/i.test(c.name));
  if (wifi) return wifi.address;

  const ethernet = candidates.find((c) => /eth|ethernet|en\d/i.test(c.name));
  if (ethernet) return ethernet.address;

  return candidates[0]?.address || '127.0.0.1';
}

const FACTOR_MAP = {
  '죄책감': 'guilt',
  '운전능력 과신': 'overconfidence',
  '잘못된 손익계산': 'miscalculation',
  '내부귀인': 'internal_attr',
  '외부귀인': 'external_attr',
  '자기통제력': 'self_control',
  '충동성': 'impulsiveness',
  '감각추구성향': 'sensation_seeking',
  '도덕성': 'morality'
};

const FACTOR_QUESTION_MAP = {};
for (const val of Object.values(FACTOR_MAP)) {
  FACTOR_QUESTION_MAP[val] = [];
}
for (const q of ALL_QUESTIONS) {
  const engFactor = FACTOR_MAP[q.factor];
  if (engFactor) {
    FACTOR_QUESTION_MAP[engFactor].push(q.id);
  }
}

export function computeScores(rawAnswers) {
  const answers = { ...rawAnswers };
  for (const q of ALL_QUESTIONS) {
    if (q.reverse && answers[q.id] !== undefined) {
      const val = Number(answers[q.id]);
      if (Number.isInteger(val) && val >= 1 && val <= 5) {
        answers[q.id] = 6 - val;
      }
    }
  }

  const results = calculateAllResults(answers, FACTOR_QUESTION_MAP);
  const typeKey = getOverallType(results);
  const typeDetails = TYPE_DETAILS[typeKey] || TYPE_DETAILS['판정불가'];
  const overallType = typeDetails.name;

  results.overall = typeDetails;

  return {
    impatienceScore: results.guilt?.score || 0,
    conformityScore: results.overconfidence?.score || 0,
    riskScore: results.miscalculation?.score || 0,
    resultType: overallType,
    results,
  };
}

export { FACTOR_QUESTION_MAP };
