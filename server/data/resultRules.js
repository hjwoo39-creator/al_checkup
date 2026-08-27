/**
 * 음주성향 자가진단 결과 판정 규칙
 */

export const RESULT_RULES = {
  guilt: {
    id: 'guilt',
    title: '죄책감',
    description: '음주운전 행위에 대해 스스로 느끼는 죄의식과 부끄러움의 정도입니다.',
    threshold: 24,
    positive: true,
    ranges: [
      {
        min: 8,
        max: 23,
        level: '주의',
        levelText: '낮음',
        type: '죄책감 낮음',
        message: '음주운전에 대한 죄의식이 부족합니다.',
        detail: '음주운전에 대한 부끄러움이나 죄의식을 상대적으로 덜 느끼는 경향이 있어 음주운전에 취약할 수 있습니다.',
      },
      {
        min: 24,
        max: 40,
        level: '양호',
        levelText: '높음',
        type: '죄책감 높음',
        message: '음주운전이 큰 범죄임을 인식하고 있습니다.',
        detail: '음주운전이 큰 범죄이며 부끄러운 행동이라는 사실을 명확히 인지하고 있습니다.',
      },
    ],
  },
  overconfidence: {
    id: 'overconfidence',
    title: '운전능력 과신',
    description: '술을 마셔도 본인의 운전 실력은 영향받지 않는다고 믿는 정도입니다.',
    threshold: 15,
    positive: false,
    ranges: [
      {
        min: 8,
        max: 14,
        level: '양호',
        levelText: '낮음',
        type: '과신 낮음',
        message: '음주로 인한 운전능력 저하를 인지하고 있습니다.',
        detail: '술을 마시면 운전 실력이 저하되고 위험하다는 것을 합리적으로 알고 있습니다.',
      },
      {
        min: 15,
        max: 40,
        level: '주의',
        levelText: '높음',
        type: '과신 높음',
        message: '음주 상황에서의 운전 실력을 과대평가하고 있습니다.',
        detail: '술을 마셔도 평소처럼 운전할 수 있다고 자신하여 음주운전을 감행할 우려가 큽니다.',
      },
    ],
  },
  miscalculation: {
    id: 'miscalculation',
    title: '잘못된 손익계산',
    description: '대리 비용을 아끼거나 귀찮음을 모면하기 위해 음주운전이 더 이익이라고 판단하는 정도입니다.',
    threshold: 10,
    positive: false,
    ranges: [
      {
        min: 3,
        max: 9,
        level: '양호',
        levelText: '낮음',
        type: '손익계산 양호',
        message: '음주운전의 법적·신체적 손실을 이해하고 있습니다.',
        detail: '음주운전으로 인한 손해(벌금, 사고 위험 등)가 당장의 편의나 대리비보다 훨씬 큼을 잘 알고 있습니다.',
      },
      {
        min: 10,
        max: 15,
        level: '주의',
        levelText: '높음',
        type: '손익계산 왜곡',
        message: '대리비용이나 시간적 이득에 왜곡된 가치를 둡니다.',
        detail: '대리비용을 아끼거나 당장의 이득을 위해 음주운전의 벌금이나 법적 위험을 과소평가하는 경향이 있습니다.',
      },
    ],
  },
  internal_attr: {
    id: 'internal_attr',
    title: '내부귀인',
    description: '자신의 미래와 행동 결과가 스스로의 의지와 노력에 달려 있다고 믿는 경향입니다.',
    threshold: 13,
    positive: true,
    ranges: [
      {
        min: 4,
        max: 12,
        level: '주의',
        levelText: '낮음',
        type: '내부귀인 낮음',
        message: '자신의 통제력을 과소평가합니다.',
        detail: '자신의 행동 결과를 스스로의 통제 밖에 있다고 생각하여 자기 책임을 회피할 수 있습니다.',
      },
      {
        min: 13,
        max: 20,
        level: '양호',
        levelText: '높음',
        type: '내부귀인 높음',
        message: '스스로의 의지와 책임을 중요시합니다.',
        detail: '스스로의 의지와 노력을 중요하게 여기며, 자신의 행동에 주체적인 책임감을 느낍니다.',
      },
    ],
  },
  external_attr: {
    id: 'external_attr',
    title: '외부귀인',
    description: '자신의 인생이나 사고 여부가 운이나 외부 환경 등 우연에 의해 결정된다고 보는 경향입니다.',
    threshold: 13,
    positive: false,
    ranges: [
      {
        min: 4,
        max: 12,
        level: '양호',
        levelText: '낮음',
        type: '외부귀인 낮음',
        message: '운에 기대지 않는 태도를 가집니다.',
        detail: '사고나 결과를 운 탓으로 돌리지 않고 능동적으로 대처하려 노력합니다.',
      },
      {
        min: 13,
        max: 20,
        level: '주의',
        levelText: '높음',
        type: '외부귀인 높음',
        message: '사고나 단속을 운에 맡기려는 경향이 있습니다.',
        detail: '자동차 사고나 단속 여부를 대부분 \'재수나 운\'에 달린 문제로 보아 위험을 감수하는 편입니다.',
      },
    ],
  },
  self_control: {
    id: 'self_control',
    title: '자기통제력',
    description: '본인의 충동과 욕구, 또는 화가 난 상황을 스스로 다스리고 제어하는 능력입니다.',
    threshold: 9,
    positive: true,
    ranges: [
      {
        min: 3,
        max: 8,
        level: '주의',
        levelText: '낮음',
        type: '자기통제력 낮음',
        message: '충동 제어가 약한 편입니다.',
        detail: '충동이나 욕구를 다스리기 힘들어 술김에 부적절한 결정을 내릴 확률이 높습니다.',
      },
      {
        min: 9,
        max: 15,
        level: '양호',
        levelText: '높음',
        type: '자기통제력 높음',
        message: '욕구와 감정을 다스릴 수 있습니다.',
        detail: '감정이나 충동이 일어나더라도 이성적으로 제어하고 스스로를 통제할 수 있습니다.',
      },
    ],
  },
  impulsiveness: {
    id: 'impulsiveness',
    title: '충동성',
    description: '행동의 결과를 미리 신중하게 숙고하지 않고 즉흥적으로 행동하려는 경향입니다.',
    threshold: 17,
    positive: false,
    ranges: [
      {
        min: 6,
        max: 16,
        level: '양호',
        levelText: '낮음',
        type: '충동성 낮음',
        message: '신중하고 계획적으로 대처합니다.',
        detail: '어떤 결정을 내리기 전에 장단점을 신중하게 고려하고 계획적으로 행동합니다.',
      },
      {
        min: 17,
        max: 30,
        level: '주의',
        levelText: '높음',
        type: '충동성 높음',
        message: '즉흥적이고 충동적으로 행동할 경향이 있습니다.',
        detail: '충동을 이기지 못하고 즉흥적인 판단으로 실수를 하거나 나중에 후회할 행동을 할 우려가 있습니다.',
      },
    ],
  },
  sensation_seeking: {
    id: 'sensation_seeking',
    title: '감각추구성향',
    description: '새롭고 짜릿하며 모험적인 경험이나 자극을 추구하려는 성향입니다.',
    threshold: 24,
    positive: false,
    ranges: [
      {
        min: 7,
        max: 23,
        level: '양호',
        levelText: '낮음',
        type: '감각추구 낮음',
        message: '모험보다 안정과 규범을 중시합니다.',
        detail: '위험한 자극이나 모험보다 안정적이고 규범적인 테두리 안에서의 만족을 선호합니다.',
      },
      {
        min: 24,
        max: 35,
        level: '주의',
        levelText: '높음',
        type: '감각추구 높음',
        message: '위험을 수반하는 짜릿한 모험을 추구합니다.',
        detail: '규칙을 어기는 데서 오는 스릴이나 짜릿함을 즐기려 하여 음주운전 등의 탈법을 모험으로 인지할 우려가 있습니다.',
      },
    ],
  },
  morality: {
    id: 'morality',
    title: '도덕성',
    description: '규칙과 규범을 성실히 준수하고 비도덕적인 행동에 수치심과 부끄러움을 느끼는 정도입니다.',
    threshold: 19,
    positive: true,
    ranges: [
      {
        min: 6,
        max: 18,
        level: '주의',
        levelText: '낮음',
        type: '도덕성 낮음',
        message: '도덕적 기준과 가책이 느슨한 편입니다.',
        detail: '남들이 보지 않거나 처벌이 약하다면 사소한 반도덕적 행동이나 규칙 위반을 저지를 위험이 큽니다.',
      },
      {
        min: 19,
        max: 30,
        level: '양호',
        levelText: '높음',
        type: '도덕성 높음',
        message: '규범을 성실히 지키며 양심적으로 행동합니다.',
        detail: '남이 보지 않더라도 도덕적인 행동을 하기 위해 노력하며 위법행위에 대해 양심적 가책을 가집니다.',
      },
    ],
  },
};

export const TYPE_DETAILS = {
  '1가': {
    name: '1가형',
    title: '범죄인식형 과신운전',
    detail: '음주운전이 큰 범죄라는 사실을 알고 있음. 평소 본인의 운전 실력이 뛰어나다고 생각하기 때문에, 음주로 인해 신체 운동 기능이 둔화된 상황에서도 위험성을 깨닫지 못하고 음주운전을 하는 것이 위험하지 않다고 생각할 수 있음.',
  },
  '1나': {
    name: '1나형',
    title: '처벌불안형 우려운전',
    detail: '음주운전이 잘못된 행위라는 것을 잘 알고 있음. 또한, 음주운전으로 인한 비용적 손실이나 위험성 또한 알고 있기에 벌금이나 법적인 조치를 받게 되는 결과에 대하여 두려워함. 그러나 자신의 운전 실력에 대한 믿음 때문에 음주운전의 위험성을 낮게 판단하는 경향이 있음.',
  },
  '2가': {
    name: '2가형',
    title: '둔감형 이익지향운전',
    detail: '음주운전이 범죄행위이자 위험한 행위라는 것에 대해 잘 모르고 있는 것은 아닌지 되돌아볼 필요가 있음. 음주운전을 하더라도 신중하게 운전을 하면 위험하지 않을거라 생각하며, 당장의 시간적, 비용적 이득을 위해 운전실력에 대한 자신감을 바탕으로 음주운전을 할 가능성이 높음.',
  },
  '2나': {
    name: '2나형',
    title: '법규불만형 방종운전',
    detail: '음주운전 처벌의 필요성에 크게 공감하고 있지 못할 수 있음. 음주운전보다 다른 방법을 선택하는 것이 효율적이라고 생각하는 경향이 있으나, 평소 자신의 운전 실력이 뛰어나기 때문에 음주운전으로 인한 위험한 상황이 발생하지 않을 것이라는 안일한 생각을 하게 될 수 있음.',
  },
  '3가': {
    name: '3가형',
    title: '상황통제형 효율운전',
    detail: '음주 상태에서 운전을 하는 것은 위험하다고 생각하지만 음주 상황을 스스로 통제할 수 있다고 판단할 때에는 음주운전을 하는 것이 문제가 없다고 생각하는 경향이 있음. 또한 음주운전을 하는 것이 비용을 아낄 수 있는 효율적인 방법이라고 생각할 수 있음.',
  },
  '3나': {
    name: '3나형',
    title: '죄의식 결여형 반복운전',
    detail: '음주 상태에서 운전을 하면 평소처럼 운전하기 어렵다는 것을 잘 알고 있으며, 음주운전으로 인한 피해의 심각성도 잘 알고 있음. 그러나 근본적으로 음주운전 행위 자체에 대한 죄의식을 느끼지 못하고 있다면 결국 음주운전을 반복하게 될 가능성이 높음.',
  },
  '4가': {
    name: '4가형',
    title: '위험감수형 이익저울질운전',
    detail: '음주운전의 위법성과 위험성을 잘 이해하고 있으며 음주 상태에서 운전을 하는 것은 사고로 이어질 가능성이 높다는 사실을 잘 알고 있음. 그러나 당장의 시간적, 비용적 이득을 생각할 때 음주운전을 하는 것이 낫다고 잘못 판단하는 경향이 있음.',
  },
  '4나': {
    name: '4나형',
    title: '이상적 모범형 운전자',
    detail: '음주운전은 하지 말아야 할 행동임을 잘 알고 있으며 음주운전의 심각성을 제대로 인식하고 있기 때문에 음주운전을 지속하게 될 가능성은 낮음. 그럼에도 불구하고 음주운전을 한다면, 음주운전을 할 수 밖에 없는 상황이었다고 변명하며 책임을 외부로 돌리고 있을 가능성이 있음.',
  },
  '판정불가': {
    name: '판정불가',
    title: '판정불가',
    detail: '유형을 판정할 수 없습니다. 응답 데이터를 다시 확인해 주세요.',
  },
};

/**
 * 요인점수로 개별 결과 판정
 * @param {string} factorId
 * @param {number} score
 */
export function calculateSectionResult(factorId, score) {
  const rules = RESULT_RULES[factorId];
  if (!rules) return null;

  const range = rules.ranges.find((r) => score >= r.min && score <= r.max);
  if (!range) {
    const last = rules.ranges[rules.ranges.length - 1];
    if (score > last.max) return { ...last, score, factorId, factorTitle: rules.title };
    const first = rules.ranges[0];
    if (score < first.min) return { ...first, score, factorId, factorTitle: rules.title };
    return null;
  }

  return {
    ...range,
    score,
    factorId,
    factorTitle: rules.title,
  };
}

/**
 * 전체 응답으로 9개 영역 결과 계산
 * @param {Object} answers - { questionId: score(1-5) }
 * @param {Object} factorQuestionMap - { factorId: [questionIds] }
 */
export function calculateAllResults(answers, factorQuestionMap) {
  const results = {};

  for (const [factorId, questionIds] of Object.entries(factorQuestionMap)) {
    const score = questionIds.reduce((sum, qId) => sum + (answers[qId] || 0), 0);
    results[factorId] = calculateSectionResult(factorId, score);
  }

  return results;
}

export function getOverallType(results) {
  const guiltHigh = results.guilt?.levelText === '높음';
  const overconfidenceHigh = results.overconfidence?.levelText === '높음';
  const miscalculationHigh = results.miscalculation?.levelText === '높음';

  let typeKey = '';
  if (guiltHigh && overconfidenceHigh && miscalculationHigh) typeKey = '1가';
  else if (guiltHigh && overconfidenceHigh && !miscalculationHigh) typeKey = '1나';
  else if (!guiltHigh && overconfidenceHigh && miscalculationHigh) typeKey = '2가';
  else if (!guiltHigh && overconfidenceHigh && !miscalculationHigh) typeKey = '2나';
  else if (!guiltHigh && !overconfidenceHigh && miscalculationHigh) typeKey = '3가';
  else if (!guiltHigh && !overconfidenceHigh && !miscalculationHigh) typeKey = '3나';
  else if (guiltHigh && !overconfidenceHigh && miscalculationHigh) typeKey = '4가';
  else if (guiltHigh && !overconfidenceHigh && !miscalculationHigh) typeKey = '4나';
  else typeKey = '판정불가';

  return typeKey;
}
