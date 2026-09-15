import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, BookOpenCheck, Brain, ClipboardList, Dice5, GitBranch, Layers3, RotateCcw, Search, Sparkles, Target, Trophy } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { bankSummary, categories, platforms, questions, type Category, type Platform, type Question } from './questions';
import './style.css';

type SelectedPlatform = Platform | '全部平台';
type SelectedCategory = Category | '全部题型';
type Progress = Record<string, { attempts: number; correct: number; mastered: boolean; lastAnswer?: number }>;
type MockPreset = {
  title: string;
  description: string;
  platform: SelectedPlatform;
  total: number;
  plan: Partial<Record<Category, number>>;
};

const storageKey = 'qiuzhao-assessment-progress-v1';
const primaryPlatforms: Platform[] = ['北森', 'SHL'];

const mockPresets: MockPreset[] = [
  {
    title: '通用秋招 40 题',
    description: '适合管培、运营、销售、职能岗的网申综合测评比例。',
    platform: '全部平台',
    total: 40,
    plan: { 资料分析: 10, 言语理解: 8, 逻辑推理: 8, 图形推理: 6, 情境判断: 4, 性格测评: 4 }
  },
  {
    title: '北森专项 50 题',
    description: '偏通用能力测评：数量资料、言语逻辑、情境和性格一起练。',
    platform: '北森',
    total: 50,
    plan: { 资料分析: 12, 数字推理: 8, 言语理解: 8, 逻辑推理: 10, 图形推理: 5, 情境判断: 4, 性格测评: 3 }
  },
  {
    title: 'SHL 专项 50 题',
    description: '贴近 SHL 常见 Verbal / Numerical / Inductive / Deductive / SJT 结构。',
    platform: 'SHL',
    total: 50,
    plan: { 资料分析: 12, 言语理解: 10, 图形推理: 10, 逻辑推理: 10, 情境判断: 5, 性格测评: 3 }
  }
];

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

function levelOf(item?: Progress[string]) {
  if (!item || item.attempts === 0) return '未练习';
  const rate = item.correct / item.attempts;
  if (item.mastered || (item.attempts >= 2 && rate >= 0.85)) return '已掌握';
  if (rate >= 0.6) return '巩固中';
  return '需复盘';
}

function pickRandom<T>(arr: T[], count: number) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function App() {
  const [platform, setPlatform] = useState<SelectedPlatform>('北森');
  const [category, setCategory] = useState<SelectedCategory>('全部题型');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [quiz, setQuiz] = useState<Question[]>(() => pickRandom(questions, 10));
  const [randomMode, setRandomMode] = useState(false);
  const [mockTitle, setMockTitle] = useState('自由随机练习');
  const [mockPlan, setMockPlan] = useState<Partial<Record<Category, number>>>({});
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeId, setActiveId] = useState(questions[0].id);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [query, setQuery] = useState('');

  const visibleQuestions = randomMode ? quiz : questions;

  const pool = useMemo(() => {
    const filtered = visibleQuestions.filter((q) => {
      const byPlatform = randomMode || platform === '全部平台' || q.platform === platform;
      const byCategory = randomMode || category === '全部题型' || q.category === category;
      const byQuery = query.trim() ? `${q.stem}${q.platform}${q.category}${q.tip}${q.explanation}`.toLowerCase().includes(query.toLowerCase()) : true;
      return byPlatform && byCategory && byQuery;
    });
    return filtered.length ? filtered : visibleQuestions;
  }, [visibleQuestions, platform, category, query, randomMode]);

  const active = pool.find((q) => q.id === activeId) || pool[0] || questions[0];
  const activeAnswer = randomMode ? sessionAnswers[active.id] : selected;

  const stats = useMemo(() => {
    const attempted = questions.filter((q) => progress[q.id]?.attempts).length;
    const mastered = questions.filter((q) => levelOf(progress[q.id]) === '已掌握').length;
    const attempts = Object.values(progress).reduce((sum, p) => sum + p.attempts, 0);
    const correct = Object.values(progress).reduce((sum, p) => sum + p.correct, 0);
    const byCategory = categories.map((name) => {
      const list = questions.filter((q) => q.category === name && (platform === '全部平台' || q.platform === platform));
      const done = list.filter((q) => levelOf(progress[q.id]) === '已掌握').length;
      return { name, 掌握率: list.length ? Math.round((done / list.length) * 100) : 0 };
    });
    return { attempted, mastered, attempts, accuracy: attempts ? Math.round((correct / attempts) * 100) : 0, byCategory };
  }, [progress, platform]);

  const mockStats = useMemo(() => {
    const answered = Object.keys(sessionAnswers).filter((id) => quiz.some((q) => q.id === id)).length;
    const correct = quiz.reduce((sum, q) => sum + (sessionAnswers[q.id] === q.answer ? 1 : 0), 0);
    return { answered, correct, total: quiz.length, rate: answered ? Math.round((correct / answered) * 100) : 0 };
  }, [quiz, sessionAnswers]);

  const report = useMemo(() => {
    const wrongQuestions = quiz.filter((q) => sessionAnswers[q.id] !== undefined && sessionAnswers[q.id] !== q.answer);
    const missedQuestions = quiz.filter((q) => sessionAnswers[q.id] === undefined);
    const byCategory = categories
      .map((name) => {
        const list = quiz.filter((q) => q.category === name);
        const answered = list.filter((q) => sessionAnswers[q.id] !== undefined).length;
        const correct = list.filter((q) => sessionAnswers[q.id] === q.answer).length;
        const wrong = list.filter((q) => sessionAnswers[q.id] !== undefined && sessionAnswers[q.id] !== q.answer).length;
        return { name, total: list.length, answered, correct, wrong, rate: answered ? Math.round((correct / answered) * 100) : 0 };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.wrong - a.wrong || a.rate - b.rate);
    return { wrongQuestions, missedQuestions, byCategory };
  }, [quiz, sessionAnswers]);

  const platformStats = platforms.map((name) => {
    const list = questions.filter((q) => q.platform === name);
    const done = list.filter((q) => progress[q.id]?.attempts).length;
    return { name, done, total: list.length };
  });

  const categoryStats = categories.map((name) => {
    const list = questions.filter((q) => q.category === name && (platform === '全部平台' || q.platform === platform));
    const done = list.filter((q) => progress[q.id]?.attempts).length;
    return { name, done, total: list.length };
  });

  function persist(next: Progress) {
    setProgress(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function jumpTo(nextPlatform: SelectedPlatform, nextCategory: SelectedCategory = '全部题型') {
    setRandomMode(false);
    setPlatform(nextPlatform);
    setCategory(nextCategory);
    setMockTitle('自由专项练习');
    setIsSubmitted(false);
    const next = questions.find((q) => (nextPlatform === '全部平台' || q.platform === nextPlatform) && (nextCategory === '全部题型' || q.category === nextCategory));
    if (next) setActiveId(next.id);
    setSelected(null);
    setShowResult(false);
  }

  function buildMock(preset: MockPreset) {
    const selectedQuestions: Question[] = [];
    Object.entries(preset.plan).forEach(([categoryName, count]) => {
      const source = questions.filter((q) => (preset.platform === '全部平台' || q.platform === preset.platform) && q.category === categoryName);
      selectedQuestions.push(...pickRandom(source, Number(count)));
    });
    if (selectedQuestions.length < preset.total) {
      const used = new Set(selectedQuestions.map((q) => q.id));
      const rest = questions.filter((q) => (preset.platform === '全部平台' || q.platform === preset.platform) && !used.has(q.id));
      selectedQuestions.push(...pickRandom(rest, preset.total - selectedQuestions.length));
    }
    const next = pickRandom(selectedQuestions, preset.total);
    setQuiz(next);
    setRandomMode(true);
    setMockTitle(preset.title);
    setMockPlan(preset.plan);
    setPlatform(preset.platform);
    setCategory('全部题型');
    setSessionAnswers({});
    setIsSubmitted(false);
    setActiveId(next[0].id);
    setSelected(null);
    setShowResult(false);
  }

  function buildWeakPlan(source: 'session' | 'history' = 'history'): MockPreset {
    const ranked = categories
      .map((name) => {
        if (source === 'session') {
          const list = quiz.filter((q) => q.category === name);
          const wrong = list.filter((q) => sessionAnswers[q.id] !== q.answer).length;
          return { name, score: wrong, hasSignal: wrong > 0 };
        }
        const list = questions.filter((q) => q.category === name && (platform === '全部平台' || q.platform === platform));
        const attempts = list.reduce((sum, q) => sum + (progress[q.id]?.attempts || 0), 0);
        const correct = list.reduce((sum, q) => sum + (progress[q.id]?.correct || 0), 0);
        const accuracy = attempts ? correct / attempts : 0;
        return { name, score: attempts ? 1 - accuracy : 0.65, hasSignal: attempts > 0 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const weakTypes = ranked.filter((item) => item.hasSignal).length ? ranked.filter((item) => item.hasSignal).slice(0, 3) : ranked;
    const plan = weakTypes.reduce<Partial<Record<Category, number>>>((acc, item) => ({ ...acc, [item.name]: 8 }), {});
    return {
      title: source === 'session' ? '错题弱项强化 24 题' : '历史薄弱强化 24 题',
      description: '根据错题或历史正确率自动选择 3 个薄弱题型，每类抽 8 题。',
      platform,
      total: weakTypes.length * 8,
      plan
    };
  }

  function answerQuestion(index: number) {
    if (randomMode) {
      if (isSubmitted) return;
      setSelected(index);
      setSessionAnswers((prev) => ({ ...prev, [active.id]: index }));
      return;
    }
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    const prev = progress[active.id] || { attempts: 0, correct: 0, mastered: false };
    persist({
      ...progress,
      [active.id]: {
        attempts: prev.attempts + 1,
        correct: prev.correct + (index === active.answer ? 1 : 0),
        mastered: prev.mastered,
        lastAnswer: index
      }
    });
  }

  function submitMock() {
    if (!randomMode) return;
    const nextProgress = { ...progress };
    quiz.forEach((q) => {
      const answer = sessionAnswers[q.id];
      if (answer === undefined) return;
      const prev = nextProgress[q.id] || { attempts: 0, correct: 0, mastered: false };
      nextProgress[q.id] = {
        attempts: prev.attempts + 1,
        correct: prev.correct + (answer === q.answer ? 1 : 0),
        mastered: prev.mastered || answer === q.answer,
        lastAnswer: answer
      };
    });
    persist(nextProgress);
    setIsSubmitted(true);
    setShowResult(true);
  }

  function toggleMastered() {
    const prev = progress[active.id] || { attempts: 0, correct: 0, mastered: false };
    persist({ ...progress, [active.id]: { ...prev, mastered: !prev.mastered } });
  }

  function nextQuestion() {
    const currentIndex = pool.findIndex((q) => q.id === active.id);
    const next = pool[(currentIndex + 1) % pool.length];
    setActiveId(next.id);
    setSelected(randomMode ? sessionAnswers[next.id] ?? null : null);
    setShowResult(randomMode ? isSubmitted : false);
  }

  function startRandom() {
    const source = questions.filter((q) => (platform === '全部平台' || q.platform === platform) && (category === '全部题型' || q.category === category));
    const next = pickRandom(source.length ? source : questions, 12);
    setQuiz(next);
    setRandomMode(true);
    setMockTitle('当前范围随机 12 题');
    setMockPlan({});
    setSessionAnswers({});
    setIsSubmitted(false);
    setActiveId(next[0].id);
    setSelected(null);
    setShowResult(false);
  }

  function resetAll() {
    localStorage.removeItem(storageKey);
    setProgress({});
    setSelected(null);
    setShowResult(false);
    setSessionAnswers({});
    setIsSubmitted(false);
  }

  return (
    <main className="page-bg min-h-screen text-slate-800">
      <section className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <header className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-blue-100/60 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"><Sparkles size={16} /> 北森 + SHL 全题型刷题站</div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">先找题，再刷题，最后看掌握程度</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">新增“交卷报告”和“弱项强化”：模拟套题先完整作答，交卷后集中看错题、薄弱题型和下一组推荐。</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:min-w-fit">
              <Stat icon={<BookOpenCheck />} label="总题量" value={bankSummary.total} />
              <Stat icon={<Target />} label="北森" value={bankSummary.beisenTotal} />
              <Stat icon={<GitBranch />} label="SHL" value={bankSummary.shlTotal} />
              <Stat icon={<Brain />} label="正确率" value={`${stats.accuracy}%`} />
            </div>
          </div>
        </header>

        <section className="sticky top-0 z-10 mt-4 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="label">搜索题干 / 解析 / 技巧</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3 text-slate-400" size={18} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="例如：同比增长、True False、充分条件、客户投诉" className="select pl-11" />
              </div>
            </div>
            <div>
              <label className="label">平台</label>
              <select value={platform} onChange={(e) => jumpTo(e.target.value as SelectedPlatform, category)} className="select">
                <option>全部平台</option>
                {platforms.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">题型</label>
              <select value={category} onChange={(e) => jumpTo(platform, e.target.value as SelectedCategory)} className="select">
                <option>全部题型</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-12">
          <aside className="space-y-5 lg:col-span-3">
            <Card title="秋招比例套题" icon={<ClipboardList size={18} />}>
              <div className="space-y-3">
                {mockPresets.map((preset) => (
                  <button key={preset.title} onClick={() => buildMock(preset)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-blue-100">
                    <div className="flex items-center justify-between gap-3"><span className="font-black text-blue-800">{preset.title}</span><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-blue-700">{preset.total}题</span></div>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{preset.description}</p>
                  </button>
                ))}
                <button onClick={() => buildMock(buildWeakPlan('history'))} className="w-full rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-rose-100">
                  <div className="flex items-center justify-between gap-3"><span className="font-black text-rose-800">历史薄弱强化</span><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-rose-700">24题</span></div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">按你当前平台的练习记录，自动抽 3 个薄弱题型集中刷。</p>
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-slate-500">套题模式会先记录选择，点击“交卷”后再统一展示错题和解析，更接近正式网申节奏。</div>
            </Card>

            <Card title="题库导航" icon={<Layers3 size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                {primaryPlatforms.map((name) => {
                  const total = questions.filter((q) => q.platform === name).length;
                  const activePlatform = platform === name && !randomMode;
                  return <button key={name} onClick={() => jumpTo(name)} className={`rounded-2xl p-4 text-left transition ${activePlatform ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><div className="text-xl font-black">{name}</div><div className="mt-1 text-sm opacity-80">{total} 题</div></button>;
                })}
              </div>
              <button onClick={() => jumpTo('全部平台')} className="mt-3 w-full rounded-2xl bg-blue-50 px-4 py-3 text-left font-bold text-blue-700 hover:bg-blue-100">查看全部平台题库</button>
            </Card>

            <Card title="题型入口" icon={<BarChart3 size={18} />}>
              <div className="space-y-2">
                <button onClick={() => jumpTo(platform, '全部题型')} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${category === '全部题型' && !randomMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>全部题型 · {questions.filter((q) => platform === '全部平台' || q.platform === platform).length} 题</button>
                {categoryStats.map((item) => (
                  <button key={item.name} onClick={() => jumpTo(platform, item.name)} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${category === item.name && !randomMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-blue-50'}`}>
                    <span className="flex justify-between"><span>{item.name}</span><span>{item.total}</span></span>
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          <section className="space-y-5 lg:col-span-6">
            {randomMode && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-lg shadow-amber-100/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h3 className="text-xl font-black text-slate-900">{mockTitle}</h3><p className="mt-1 text-sm text-slate-600">已答 {mockStats.answered}/{mockStats.total} 题 · {isSubmitted ? `最终得分 ${mockStats.correct}/${mockStats.total} · 正确率 ${mockStats.rate}%` : '交卷后统一看解析和错题报告'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={submitMock} disabled={isSubmitted || mockStats.answered === 0} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">交卷看报告</button>
                    <button onClick={startRandom} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100">重抽当前范围</button>
                  </div>
                </div>
                {Object.keys(mockPlan).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{Object.entries(mockPlan).map(([name, count]) => <span key={name} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{name} {count}题</span>)}</div>}
              </div>
            )}

            {randomMode && isSubmitted && (
              <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-lg shadow-emerald-100/60">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700"><Trophy size={16} /> 交卷报告</div>
                    <h3 className="text-2xl font-black text-slate-900">得分 {mockStats.correct}/{mockStats.total}，正确率 {mockStats.rate}%</h3>
                    <p className="mt-2 text-sm text-slate-600">错题 {report.wrongQuestions.length} 道，未作答 {report.missedQuestions.length} 道。建议优先复盘错题最多、正确率最低的题型。</p>
                  </div>
                  <button onClick={() => buildMock(buildWeakPlan('session'))} className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-100">按本卷错题推荐下一组</button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {report.byCategory.slice(0, 6).map((item) => (
                    <div key={item.name} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex justify-between text-sm font-black text-slate-800"><span>{item.name}</span><span>{item.rate}%</span></div>
                      <p className="mt-1 text-xs text-slate-500">答 {item.answered}/{item.total} · 错 {item.wrong}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {(report.wrongQuestions.length ? report.wrongQuestions : report.missedQuestions).slice(0, 5).map((q) => (
                    <button key={q.id} onClick={() => { setActiveId(q.id); setSelected(sessionAnswers[q.id] ?? null); setShowResult(true); }} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left text-sm hover:bg-blue-50">
                      <span className="mr-2 font-black text-rose-600">{q.category}</span>{q.stem.slice(0, 62)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white bg-white/95 p-6 shadow-xl shadow-slate-200/80">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2 text-sm font-semibold">
                    <span className="pill bg-blue-50 text-blue-700">{active.platform}</span>
                    <span className="pill bg-amber-50 text-amber-700">{active.category}</span>
                    <span className="pill bg-emerald-50 text-emerald-700">{active.difficulty}</span>
                    <span className="pill bg-purple-50 text-purple-700">{active.sourceType || '练习题'}</span>
                    <span className="pill bg-slate-100 text-slate-600">{levelOf(progress[active.id])}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-500">当前题池：{pool.length} 题 · {randomMode ? '比例套题测试' : '专项练习'}</p>
                  <h2 className="mt-3 text-2xl font-black leading-snug text-slate-900">{active.stem}</h2>
                </div>
                <button onClick={startRandom} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:scale-105"><Dice5 size={18} /> 自由随机 12 题</button>
              </div>

              <div className="space-y-3">
                {active.options.map((option, index) => {
                  const isRight = index === active.answer;
                  const picked = activeAnswer === index;
                  const reveal = !randomMode ? showResult : isSubmitted;
                  const resultClass = reveal ? (isRight ? 'border-emerald-400 bg-emerald-50' : picked ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white') : picked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50';
                  return (
                    <button key={option} onClick={() => answerQuestion(index)} className={`w-full rounded-2xl border p-4 text-left transition ${resultClass}`}>
                      <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{String.fromCharCode(65 + index)}</span>
                      <span className="font-medium text-slate-800">{option}</span>
                    </button>
                  );
                })}
              </div>

              {(!randomMode ? showResult : isSubmitted) && (
                <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-lg font-black text-slate-900">{activeAnswer === active.answer ? '答对了，继续保持。' : `这题选 ${String.fromCharCode(65 + active.answer)} 更稳。`}</p>
                  <p className="mt-2 leading-7 text-slate-700">{active.explanation}</p>
                  <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-blue-700">练习提示：{active.tip}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={toggleMastered} className="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700">{progress[active.id]?.mastered ? '取消掌握' : '标记已掌握'}</button>
                <button onClick={nextQuestion} className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-900 hover:bg-amber-300">下一题</button>
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-3">
            <Card title="掌握程度" icon={<Brain size={18} />}>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-2xl bg-slate-100 p-3"><b>{stats.attempted}</b><br />已练</div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><b>{stats.mastered}</b><br />掌握</div>
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><b>{stats.accuracy}%</b><br />正确</div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="掌握率" fill="#2563eb" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="套题比例说明" icon={<ClipboardList size={18} />}>
              <ul className="space-y-3 text-sm leading-6 text-slate-600">
                <li><b>通用秋招</b>：资料/数量约 25%，言语约 20%，逻辑约 20%，图形约 15%。</li>
                <li><b>交卷报告</b>：套题完成后集中展示错题、未答题和分题型正确率。</li>
                <li><b>弱项推荐</b>：根据本卷错题或历史记录，自动生成下一组强化练习。</li>
              </ul>
            </Card>

            <Card title="平台进度" icon={<GitBranch size={18} />}>
              <div className="space-y-3">
                {platformStats.map((s) => <ProgressLine key={s.name} label={s.name} value={s.done} total={s.total} />)}
              </div>
              <button onClick={resetAll} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw size={16} /> 重置进度</button>
            </Card>
          </aside>
        </section>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string | number; value: string | number }) {
  return <div className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm"><div className="mb-2 text-blue-600">{icon}</div><div className="text-2xl font-black text-slate-900">{value}</div><div className="mt-1 text-xs font-semibold text-slate-500">{label}</div></div>;
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-200/70 backdrop-blur"><h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">{icon}{title}</h3>{children}</div>;
}

function ProgressLine({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.round((value / total) * 100) : 0;
  return <div><div className="mb-1 flex justify-between text-sm font-semibold text-slate-600"><span>{label}</span><span>{value}/{total}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" style={{ width: `${width}%` }} /></div></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
