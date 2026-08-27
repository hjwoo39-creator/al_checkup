/**
 * 음주성향 자가진단 체크리스트 문항
 */

export const LIKERT_SCALE = [
  { value: 1, label: '전혀 그렇지 않다' },
  { value: 2, label: '그렇지 않다' },
  { value: 3, label: '보통이다' },
  { value: 4, label: '그렇다' },
  { value: 5, label: '매우 그렇다' },
];

export const BASIC_INFO_OPTIONS = {
  gender: ['남성', '여성', '기타'],
  ageGroup: ['20대 이하', '30대', '40대', '50대', '60대 이상'],
  drivingExperience: ['2년 미만', '2~5년', '5~10년', '10~15년', '15년 이상'],
  vehicleType: ['승용차', '승합차', '화물차', '이륜차', '기타'],
};

export const SECTIONS = [
  {
    id: 'part_1',
    title: '음주성향 자가진단 (1부)',
    subtitle: '음주 관련 행동 및 태도',
    description: '다음은 음주 관련 행동 및 귀하의 생각에 대한 질문입니다. (1~19번 문항)',
    questions: [
      { id: 'q_1', number: 1, text: '나는 술을 먹고 운전을 해도 사고가 나지 않을 것이다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_2', number: 2, text: '음주운전에 대한 처벌은 현재보다 더 강해져야 한다고 생각한다.', factor: '죄책감', reverse: false },
      { id: 'q_3', number: 3, text: '나의 음주운전 사실을 가족이나 친지들이 알게 되는 것은 부끄러운 일이다.', factor: '죄책감', reverse: false },
      { id: 'q_4', number: 4, text: '음주운전 때문에 손해를 보는 일이 거의 없다.', factor: '잘못된 손익계산', reverse: false },
      { id: 'q_5', number: 5, text: '사고나 위험은 나와 거리가 멀다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_6', number: 6, text: '나는 술을 먹고 운전을 해도 위험에 빠지지 않을 자신이 있다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_7', number: 7, text: '음주운전에 대한 처벌은 당연하다고 생각한다.', factor: '죄책감', reverse: false },
      { id: 'q_8', number: 8, text: '음주운전으로 인해 사고가 발생할 확률은 거의 없다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_9', number: 9, text: '나는 음주운전이 큰 범죄라고 생각한다.', factor: '죄책감', reverse: false },
      { id: 'q_10', number: 10, text: '술을 먹었다고 해서 나의 운전 실력은 변하지 않는다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_11', number: 11, text: '나의 음주운전 사실이 가족이나 친지들에게 알려지는 것이 부담스럽다.', factor: '죄책감', reverse: false },
      { id: 'q_12', number: 12, text: '술을 먹고 운전했을 때 오히려 운전이 더 잘 된다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_13', number: 13, text: '나는 음주운전이 부끄러운 일이라고 생각한다.', factor: '죄책감', reverse: false },
      { id: 'q_14', number: 14, text: '나의 운전 실력은 술을 먹어도 영향을 받지 않는다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_15', number: 15, text: '나는 다른 사람들보다 운전 실력이 뛰어나기 때문에 술을 먹어도 위험하지 않다.', factor: '운전능력 과신', reverse: false },
      { id: 'q_16', number: 16, text: '나의 음주운전 사실이 직장 동료들에게 알려지는 것이 부담스럽다.', factor: '죄책감', reverse: false },
      { id: 'q_17', number: 17, text: '음주운전을 하는 것이 다른 방법보다 비용적인 측면에서 더 나은 선택이다.', factor: '잘못된 손익계산', reverse: false },
      { id: 'q_18', number: 18, text: '나의 음주운전 사실을 직장 동료들이 알게 되는 것은 부끄러운 일이다.', factor: '죄책감', reverse: false },
      { id: 'q_19', number: 19, text: '대리운전 비용이 음주운전으로 인해 벌금을 내는 것보다 비싸다고 생각한다.', factor: '잘못된 손익계산', reverse: false },
    ],
  },
  {
    id: 'part_2',
    title: '음주성향 자가진단 (2부)',
    subtitle: '성향 및 사회적 태도',
    description: '다음은 개인 성향 및 태도에 대한 질문입니다. (20~49번 문항)',
    questions: [
      { id: 'q_20', number: 20, text: '나는 가끔 조금은 겁이 나는 일들을 즐긴다.', factor: '감각추구성향', reverse: false },
      { id: 'q_21', number: 21, text: '나는 기분이 아주 좋을 때 나중에 문제를 일으킬 수도 있는 행동을 할 때가 있다.', factor: '충동성', reverse: false },
      { id: 'q_22', number: 22, text: '나는 위험해 보일지라도 짜릿한 경험을 해보고 싶다.', factor: '감각추구성향', reverse: false },
      { id: 'q_23', number: 23, text: '나는 가끔 자극적이고 짜릿한 게임이나 놀이를 즐긴다.', factor: '감각추구성향', reverse: false },
      { id: 'q_24', number: 24, text: '내 인생의 상당 부분은 우연에 의해 결정되는 것 같다.', factor: '외부귀인', reverse: false },
      { id: 'q_25', number: 25, text: '내가 소원을 이룬다면 그것은 운이 좋았기 때문이다.', factor: '외부귀인', reverse: false },
      { id: 'q_26', number: 26, text: '내가 소원을 이룬다면 그것은 내가 열심히 노력했기 때문이다.', factor: '내부귀인', reverse: false },
      { id: 'q_27', number: 27, text: '나의 미래는 나의 의지에 달려있다.', factor: '내부귀인', reverse: false },
      { id: 'q_28', number: 28, text: '나는 잘못했을 때 남 탓을 하지 않는다.', factor: '도덕성', reverse: false },
      { id: 'q_29', number: 29, text: '나는 보통 어떤 일을 하기 전에 신중하게 생각한다.', factor: '충동성', reverse: true },
      { id: 'q_30', number: 30, text: '나는 가끔 피할 수 없는 상황까지 몰고 가서 그 묘미를 즐긴다.', factor: '감각추구성향', reverse: false },
      { id: 'q_31', number: 31, text: '나는 화가 많이 났을 때 감정을 추스르기 위해 노력한다.', factor: '자기통제력', reverse: false },
      { id: 'q_32', number: 32, text: '내가 노력해야 좋은 결과를 얻을 수 있다.', factor: '내부귀인', reverse: false },
      { id: 'q_33', number: 33, text: '내 인생은 나의 노력으로 결정된다고 생각한다.', factor: '내부귀인', reverse: false },
      { id: 'q_34', number: 34, text: '처벌받지 않는다면 나는 세금을 내지 않을 것이다.', factor: '도덕성', reverse: true },
      { id: 'q_35', number: 35, text: '나는 흥분하면 내 행동의 결과를 생각하지 못하는 경향이 있다.', factor: '충동성', reverse: false },
      { id: 'q_36', number: 36, text: '나는 번지점프와 같이 짜릿함을 만끽할 수 있는 운동을 해보고 싶다.', factor: '감각추구성향', reverse: false },
      { id: 'q_37', number: 37, text: '나는 나중에 후회할 일들을 충동적으로 할 때가 있다.', factor: '충동성', reverse: false },
      { id: 'q_38', number: 38, text: '내가 매우 흥분했을 때 하는 행동을 보고 다른 사람들이 놀라거나 걱정을 할 때가 있다.', factor: '충동성', reverse: false },
      { id: 'q_39', number: 39, text: '만약 떨어진 돈을 발견한다면 내가 가질 것이다.', factor: '도덕성', reverse: true },
      { id: 'q_40', number: 40, text: '나는 나의 충동과 욕구를 조절할 수 있다.', factor: '자기통제력', reverse: false },
      { id: 'q_41', number: 41, text: '자동차 사고를 당하느냐 아니냐는 대부분 운에 달려 있다.', factor: '외부귀인', reverse: false },
      { id: 'q_42', number: 42, text: '내가 출세를 할 수 있으려면 재수가 좋아야 한다.', factor: '외부귀인', reverse: false },
      { id: 'q_43', number: 43, text: '다른 사람들이 보지 않더라도 옳은 행동을 하려고 노력한다.', factor: '도덕성', reverse: false },
      { id: 'q_44', number: 44, text: '나는 화가 많이 난 상황에서도 금방 차분해진다.', factor: '자기통제력', reverse: false },
      { id: 'q_45', number: 45, text: '내 목적을 위해서라면 나는 망설이지 않고 거짓말을 할 것이다.', factor: '도덕성', reverse: true },
      { id: 'q_46', number: 46, text: '나는 모험을 즐기는 편에 속한다.', factor: '감각추구성향', reverse: false },
      { id: 'q_47', number: 47, text: '나는 정해진 규칙을 지키지 않을 때 더 특별한 재미를 느낀다.', factor: '감각추구성향', reverse: false },
      { id: 'q_48', number: 48, text: '나는 어떤 결정을 하기 전에 모든 장단점을 고려한다.', factor: '충동성', reverse: false },
      { id: 'q_49', number: 49, text: '나는 부적절한 행동을 했을 때 부끄럽다.', factor: '도덕성', reverse: false },
    ],
  },
];

export const ALL_QUESTIONS = SECTIONS.flatMap((section) =>
  section.questions.map((q) => ({ ...q, sectionId: section.id, sectionTitle: section.title }))
);

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

export function getSectionById(sectionId) {
  return SECTIONS.find((s) => s.id === sectionId);
}

export function getQuestionIdsBySection(sectionId) {
  const section = getSectionById(sectionId);
  return section ? section.questions.map((q) => q.id) : [];
}
