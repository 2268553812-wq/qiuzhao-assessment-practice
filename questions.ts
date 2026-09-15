export type Platform = '北森' | 'SHL' | 'Aon' | 'Talview/Mettl' | '通用校招';
export type Category = '言语理解' | '数字推理' | '资料分析' | '图形推理' | '逻辑推理' | '情境判断' | '性格测评' | '英语能力';

export interface Question {
  id: string;
  platform: Platform;
  category: Category;
  difficulty: '入门' | '进阶' | '冲刺';
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
  tip: string;
  sourceType?: '示例题' | '模拟题' | '复原练习题';
}

export const platforms: Platform[] = ['北森', 'SHL', 'Aon', 'Talview/Mettl', '通用校招'];
export const categories: Category[] = ['言语理解', '数字推理', '资料分析', '图形推理', '逻辑推理', '情境判断', '性格测评', '英语能力'];

const difficultyByIndex = (i: number): Question['difficulty'] => (i % 5 === 0 ? '冲刺' : i % 3 === 0 ? '进阶' : '入门');

function shuffleOptions(correct: string, distractors: string[], seed: number) {
  const raw = [correct, ...distractors.slice(0, 3)];
  const shift = seed % raw.length;
  const options = raw.map((_, index) => raw[(index + shift) % raw.length]);
  return { options, answer: options.indexOf(correct) };
}

function makeNumberSeries(startIndex: number, count: number): Question[] {
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const base = 2 + (i % 9);
    const step = 2 + (i % 7);
    const nums = Array.from({ length: 5 }, (_, k) => base + step * k + k * (k + 1));
    const next = base + step * 5 + 5 * 6;
    const { options, answer } = shuffleOptions(String(next), [String(next - step), String(next + step), String(next + 6)], i);
    return {
      id: `bs-num-${String(i).padStart(4, '0')}`,
      platform: '北森' as const,
      category: '数字推理' as const,
      difficulty: difficultyByIndex(i),
      stem: `数列 ${nums.join('、')}、（ ）的下一项是？`,
      options,
      answer,
      explanation: `相邻差逐步增加，下一项按同一规律为 ${next}。`,
      tip: '数字推理先看相邻差、倍数、平方数和分组规律，限时训练比慢慢算更重要。',
      sourceType: '模拟题' as const
    };
  });
}

function makeBeisenData(startIndex: number, count: number): Question[] {
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const last = 800 + (i % 16) * 120;
    const rate = 10 + (i % 9) * 5;
    const current = Math.round(last * (1 + rate / 100));
    if (i % 2 === 0) {
      const { options, answer } = shuffleOptions(`${rate}%`, [`${rate - 5}%`, `${rate + 5}%`, `${rate + 10}%`], i);
      return {
        id: `bs-data-${String(i).padStart(4, '0')}`,
        platform: '北森' as const,
        category: '资料分析' as const,
        difficulty: difficultyByIndex(i),
        stem: `某岗位今年收到有效申请 ${current} 份，去年为 ${last} 份。今年有效申请的同比增长率为？`,
        options,
        answer,
        explanation: `同比增长率 = (${current}-${last})/${last}，约为 ${rate}%。`,
        tip: '资料分析先确认题目问增长率、增长量还是比重变化，避免口径错位。',
        sourceType: '模拟题' as const
      };
    }
    const { options, answer } = shuffleOptions(String(last), [String(last - 80), String(last + 80), String(current)], i);
    return {
      id: `bs-data-${String(i).padStart(4, '0')}`,
      platform: '北森' as const,
      category: '资料分析' as const,
      difficulty: difficultyByIndex(i),
      stem: `某业务今年申请人数为 ${current} 人，同比增长约 ${rate}%。去年申请人数约为？`,
      options,
      answer,
      explanation: `去年人数 = 今年人数 / (1 + ${rate}%)，约为 ${last} 人。`,
      tip: '已知现期和增长率求基期，用“现期 ÷ (1+增长率)”。',
      sourceType: '模拟题' as const
    };
  });
}

function makeBeisenLogic(startIndex: number, count: number): Question[] {
  const patterns = [
    { stem: (a: string, b: string) => `所有完成${a}的人都需要参加${b}；小李不需要参加${b}。由此可以推出？`, correct: (a: string) => `小李没有完成${a}`, explain: 'A → B，非 B → 非 A，这是充分条件的逆否推理。' },
    { stem: (a: string, b: string) => `只有通过${a}，才可以进入${b}；小王进入了${b}。由此可以推出？`, correct: (a: string) => `小王通过了${a}`, explain: '“只有 A 才 B”表示 B → A，已经 B，可以推出 A。' },
    { stem: (a: string, b: string) => `如果候选人未按时完成${a}，则不能进入${b}；小张进入了${b}。由此可以推出？`, correct: (a: string) => `小张按时完成了${a}`, explain: '未完成 A → 不能 B；已经 B，可由逆否推出完成 A。' }
  ];
  const items = ['网申材料', '在线测评', '简历确认', '岗位志愿锁定', '资格审核'];
  const stages = ['面试', '复试', '终面名单', '人才库', '笔试环节'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const p = patterns[i % patterns.length];
    const a = items[i % items.length];
    const b = stages[(i + 2) % stages.length];
    const correct = p.correct(a);
    const { options, answer } = shuffleOptions(correct, [`小李一定进入了${b}`, `所有参加${b}的人都完成了${a}`, `没有完成${a}的人一定更优秀`], i);
    return { id: `bs-logic-${String(i).padStart(4, '0')}`, platform: '北森' as const, category: '逻辑推理' as const, difficulty: difficultyByIndex(i), stem: p.stem(a, b), options, answer, explanation: p.explain, tip: '逻辑题先把条件写成箭头，再判断题目问“一定推出”还是“可能成立”。', sourceType: '模拟题' as const };
  });
}

function makeBeisenVerbal(startIndex: number, count: number): Question[] {
  const topics = ['线上测评', '校招简历筛选', '结构化面试', '人才盘点', '实习转正'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const topic = topics[i % topics.length];
    const correct = `${topic}适合作为提高初筛效率的工具`;
    const { options, answer } = shuffleOptions(correct, [`${topic}已经可以完全替代人工判断`, `${topic}只适合技术岗位`, `${topic}结果可以直接决定录用`], i);
    return { id: `bs-verbal-${String(i).padStart(4, '0')}`, platform: '北森' as const, category: '言语理解' as const, difficulty: difficultyByIndex(i), stem: `材料指出：${topic}可以帮助企业提高早期筛选效率，但仍需要结合岗位要求和后续面试综合判断。下列概括最准确的是？`, options, answer, explanation: '原文强调“提高早期筛选效率”和“需要综合判断”，不能夸大为完全替代或直接录用。', tip: '言语理解要抓限定词，看到“完全、一定、只要”这类绝对化选项要谨慎。', sourceType: '模拟题' as const };
  });
}

function makeBeisenSjt(startIndex: number, count: number): Question[] {
  const scenarios = ['客户临时增加需求', '团队成员数据口径不一致', '项目节点提前', '候选人反馈测评链接失效', '主管要求当天完成复盘'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const scenario = scenarios[i % scenarios.length];
    const correct = '先澄清事实和影响，再同步关键相关方给出可执行方案';
    const { options, answer } = shuffleOptions(correct, ['直接答应所有要求，避免冲突', '先不处理，等问题扩大后再说', '立即否定对方做法并要求返工'], i);
    return { id: `bs-sjt-${String(i).padStart(4, '0')}`, platform: '北森' as const, category: '情境判断' as const, difficulty: difficultyByIndex(i), stem: `工作情境：${scenario}，但你手上的信息还不完整。你最合适的第一步是？`, options, answer, explanation: '情境判断题看角色责任、沟通协作、风险控制和行动优先级。先补齐事实，再推动解决，通常优于情绪化处理。', tip: 'SJT 选择“负责任但不过度承诺”的选项，避免极端化答案。', sourceType: '模拟题' as const };
  });
}

function makeBeisenPersonality(startIndex: number, count: number): Question[] {
  const traits = ['压力下保持稳定', '主动寻求反馈', '面对模糊任务先拆解目标', '愿意承担跨团队沟通', '重视数据和事实'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const trait = traits[i % traits.length];
    return { id: `bs-personality-${String(i).padStart(4, '0')}`, platform: '北森' as const, category: '性格测评' as const, difficulty: '入门' as const, stem: `性格测评出现与“${trait}”相关的一组陈述时，更合理的答题原则是？`, options: ['全部选择最同意', '全部选择中间项', '按长期稳定的真实行为倾向作答', '为了迎合岗位随意前后调整'], answer: 2, explanation: '性格测评通常会看稳定性和一致性。刻意塑造完美人设容易前后冲突。', tip: '性格题更像画像校验，不建议硬背答案；保持真实、一致、与岗位基本匹配。', sourceType: '模拟题' as const };
  });
}

function makeBeisenFigure(startIndex: number, count: number): Question[] {
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const base = 1 + (i % 4);
    const seq = [base, base + 2, base + 5, base + 9, base + 14];
    const next = base + 20;
    const { options, answer } = shuffleOptions(String(next), [String(next - 1), String(next + 2), String(next - 4)], i);
    return { id: `bs-figure-${String(i).padStart(4, '0')}`, platform: '北森' as const, category: '图形推理' as const, difficulty: difficultyByIndex(i), stem: `图形数量可抽象为 ${seq.join('、')}、（ ）。下一图关键元素数量应为？`, options, answer, explanation: '数量差依次为 2、3、4、5，下一差为 6。', tip: '图形推理优先拆成数量、位置、旋转、叠加、对称五类规律。', sourceType: '模拟题' as const };
  });
}

function makeShlVerbal(startIndex: number, count: number): Question[] {
  const themes = ['远程办公提升员工满意度', '价格折扣短期提升销量', '客服响应速度影响续约', '培训投入改善新人留存', '库存周转影响现金流'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const theme = themes[i % themes.length];
    const correct = i % 3 === 0 ? '无法判断' : i % 3 === 1 ? '正确' : '错误';
    const stem = correct === '正确'
      ? `材料：某研究跟踪三个月发现，${theme}，且样本中多数部门均出现同向变化。判断：该材料支持“${theme}”这一说法。`
      : correct === '错误'
        ? `材料：某研究只观察了一个部门，且没有记录变化前数据。判断：该材料已经充分证明“${theme}”。`
        : `材料：某研究提到相关指标同时变化，但未说明样本来源和对照组。判断：可以确定“${theme}”是唯一原因。`;
    const { options, answer } = shuffleOptions(correct, ['正确', '错误', '无法判断'].filter((x) => x !== correct), i);
    return { id: `shl-verbal-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '言语理解' as const, difficulty: difficultyByIndex(i), stem, options, answer, explanation: 'SHL Verbal 常见“True / False / Cannot Say”判断，必须只依据材料，不引入常识脑补。', tip: '先标出材料明确说了什么，再判断选项是否被直接支持、直接反驳或信息不足。', sourceType: '模拟题' as const };
  });
}

function makeShlNumerical(startIndex: number, count: number): Question[] {
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const q1 = 120 + (i % 15) * 12;
    const q2 = Math.round(q1 * (1 + (8 + (i % 7) * 3) / 100));
    const q3 = Math.round(q2 * (1 + (5 + (i % 5) * 4) / 100));
    const total = q1 + q2 + q3;
    const correct = i % 2 === 0 ? `${Math.round(((q3 - q1) / q1) * 100)}%` : String(total);
    const stem = i % 2 === 0
      ? `SHL Numerical 表格题：某产品 Q1/Q2/Q3 销售额分别为 ${q1}、${q2}、${q3} 万。Q3 相比 Q1 增长约多少？`
      : `SHL Numerical 表格题：某产品 Q1/Q2/Q3 销售额分别为 ${q1}、${q2}、${q3} 万。前三季度合计销售额为多少万？`;
    const { options, answer } = shuffleOptions(correct, i % 2 === 0 ? ['8%', '15%', '32%'] : [String(total - 20), String(total + 30), String(q3)], i);
    return { id: `shl-num-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '资料分析' as const, difficulty: difficultyByIndex(i), stem, options, answer, explanation: i % 2 === 0 ? '增长率 = (Q3-Q1)/Q1，先算差额再除以基期。' : '合计题直接相加，注意单位保持一致。', tip: 'SHL Numerical 重在速度和表格定位，先找行列，再做一步或两步计算。', sourceType: '模拟题' as const };
  });
}

function makeShlInductive(startIndex: number, count: number): Question[] {
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const rotation = (i % 4) + 1;
    const correct = `${rotation * 90}°顺时针旋转并增加 1 个黑点`;
    const { options, answer } = shuffleOptions(correct, [`${rotation * 90}°逆时针旋转并减少 1 个黑点`, '仅颜色反转', '仅外框数量增加'], i);
    return { id: `shl-inductive-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '图形推理' as const, difficulty: difficultyByIndex(i), stem: `SHL Inductive 图形规律题：前三个图形每步都发生同一种变换。第 ${i} 组图形的下一步最可能符合哪种规律？`, options, answer, explanation: '归纳推理要同时观察旋转、数量、颜色和位置；本题核心规律是旋转叠加数量变化。', tip: 'SHL Inductive 不靠计算，优先列“形状、方向、数量、填充、位置”五个维度。', sourceType: '模拟题' as const };
  });
}

function makeShlDeductive(startIndex: number, count: number): Question[] {
  const subjects = ['所有高绩效团队', '所有按时交付的项目', '所有通过测评的候选人', '所有合规审批单'];
  const predicates = ['都有清晰分工', '都有完整记录', '都完成了复核', '都满足必要条件'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const s = subjects[i % subjects.length];
    const p = predicates[(i + 1) % predicates.length];
    const correct = `部分对象同时满足“${s.replace('所有', '')}”和“${p}”`;
    const { options, answer } = shuffleOptions(correct, [`所有有清晰分工的团队都是${s.replace('所有', '')}`, '没有对象满足条件', '可以推出反向命题一定成立'], i);
    return { id: `shl-deductive-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '逻辑推理' as const, difficulty: difficultyByIndex(i), stem: `演绎推理：${s}${p}；至少有一个对象属于${s.replace('所有', '')}。由此必然可以推出？`, options, answer, explanation: '全称命题加存在条件，可以推出至少有一个对象具备谓词；不能反推所有谓词对象都属于该集合。', tip: 'SHL Deductive 常考全称、特称、逆否和反推陷阱。', sourceType: '模拟题' as const };
  });
}

function makeShlSjt(startIndex: number, count: number): Question[] {
  const cases = ['客户升级投诉', '跨部门信息延迟', '项目优先级冲突', '同事提交的数据异常', '主管临时调整目标'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const c = cases[i % cases.length];
    const correct = '确认事实、评估影响，并与相关方约定下一步行动';
    const { options, answer } = shuffleOptions(correct, ['立即承诺结果，不再追问细节', '把问题转交他人后不再跟进', '先表达不满，再要求对方自行解决'], i);
    return { id: `shl-sjt-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '情境判断' as const, difficulty: difficultyByIndex(i), stem: `SHL SJT：你遇到“${c}”，并且时间较紧。最合适的第一反应是？`, options, answer, explanation: '较优选项通常同时体现事实澄清、利益相关方沟通、风险控制和可执行动作。', tip: 'SJT 要避开“过度承诺、推责、情绪化、拖延”四类选项。', sourceType: '模拟题' as const };
  });
}

function makeShlPersonality(startIndex: number, count: number): Question[] {
  const dimensions = ['成就动机', '规则意识', '协作倾向', '抗压性', '开放性'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const d = dimensions[i % dimensions.length];
    return { id: `shl-opq-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '性格测评' as const, difficulty: '入门' as const, stem: `SHL OPQ/性格类题目涉及“${d}”时，更合理的作答方式是？`, options: ['所有积极项都选最高', '根据长期稳定行为倾向作答', '全部选择中间值', '前后题目随意调整以显得完美'], answer: 1, explanation: '人格/职业风格测评更重视一致性和岗位匹配，刻意完美化可能触发不一致。', tip: '性格题不要当成知识题刷答案，重点是理解维度并保持一致。', sourceType: '模拟题' as const };
  });
}

function makeShlEnglish(startIndex: number, count: number): Question[] {
  const verbs = ['submit', 'review', 'confirm', 'update', 'prepare'];
  return Array.from({ length: count }, (_, n) => {
    const i = startIndex + n;
    const v = verbs[i % verbs.length];
    const correct = v;
    const { options, answer } = shuffleOptions(correct, [`${v}s`, `${v}ed`, `${v}ing`], i);
    return { id: `shl-english-${String(i).padStart(4, '0')}`, platform: 'SHL' as const, category: '英语能力' as const, difficulty: difficultyByIndex(i), stem: `Choose the best word: The manager asked the team to _____ the report before Friday.`, options, answer, explanation: 'ask sb. to do sth. 后接动词原形。', tip: '英语能力题先抓固定搭配和句子结构，再看商务语境。', sourceType: '模拟题' as const };
  });
}

const beisenBank: Question[] = [
  ...makeNumberSeries(1, 220),
  ...makeBeisenData(1, 240),
  ...makeBeisenLogic(1, 220),
  ...makeBeisenVerbal(1, 200),
  ...makeBeisenSjt(1, 180),
  ...makeBeisenPersonality(1, 100),
  ...makeBeisenFigure(1, 80)
];

const shlBank: Question[] = [
  ...makeShlVerbal(1, 220),
  ...makeShlNumerical(1, 260),
  ...makeShlInductive(1, 220),
  ...makeShlDeductive(1, 220),
  ...makeShlSjt(1, 180),
  ...makeShlPersonality(1, 100),
  ...makeShlEnglish(1, 40)
];

const seedQuestions: Question[] = [
  {
    id: 'aon-logic-01', platform: 'Aon', category: '逻辑推理', difficulty: '冲刺', sourceType: '示例题',
    stem: '五名同学排队，甲不在第一位，乙在丙前面，丁紧挨着戊。若丙在第四位，且乙不在第一位，下列哪项可能成立？',
    options: ['乙在第五位', '甲在第一位', '丁在第二位且戊在第三位', '戊在第一位且丁在第二位'], answer: 3,
    explanation: '戊一丁二、乙三、丙四、甲五时全部条件成立。', tip: '排列题先列硬约束，再尝试构造。'
  },
  {
    id: 'mettl-eng-01', platform: 'Talview/Mettl', category: '英语能力', difficulty: '入门', sourceType: '示例题',
    stem: 'Choose the best word: The manager asked the team to _____ the report before Friday.',
    options: ['submit', 'submits', 'submitted', 'submitting'], answer: 0,
    explanation: 'ask sb. to do sth. 后接动词原形，所以选 submit。', tip: '英语测评常考基础语法、商务词汇和阅读速度。'
  },
  {
    id: 'general-sjt-01', platform: '通用校招', category: '情境判断', difficulty: '冲刺', sourceType: '示例题',
    stem: '客户临时提出超出合同范围的需求，并要求当天交付。你会优先怎么做？',
    options: ['马上答应', '直接拒绝', '澄清影响并确认边界后给替代方案', '等客户再次催促'], answer: 2,
    explanation: '较优动作兼顾客户响应、边界意识和内部协同。', tip: '销售、运营、管培类岗位常考客户导向与规则意识的平衡。'
  }
];

export const questions: Question[] = [...beisenBank, ...shlBank, ...seedQuestions];

export const bankSummary = {
  total: questions.length,
  beisenTotal: beisenBank.length,
  shlTotal: shlBank.length,
  sourceNote: '当前内置为北森与 SHL 题型模拟/复原练习题库，可继续导入公开整理题或自有题库。'
};
