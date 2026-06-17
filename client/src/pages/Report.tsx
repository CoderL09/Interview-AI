import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface ReportData {
  score: number;
  evaluation: string;
  weaknesses: string[];
  suggestions: string[];
  resources: string[];
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-teal-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-rose-600';
};

const getScoreBg = (score: number) => {
  if (score >= 85) return 'bg-teal-50 border-teal-200';
  if (score >= 70) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 60) return '及格';
  return '需努力';
};

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report as ReportData | undefined;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  if (!report) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-4 py-10">
        <div className="surface rounded-3xl p-10 text-center max-w-md">
          <Award className="mx-auto text-slate-300" size={48} />
          <h1 className="mt-5 text-xl font-semibold text-slate-700">暂无报告数据</h1>
          <p className="mt-2 text-sm text-slate-500">请先完成一场模拟面试</p>
          <Link to="/home" className="primary-button mt-6 inline-flex px-6 py-3 text-sm">
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </span>
            InterviewAI
          </Link>
          <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
            <Link to="/home" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-950">题库</Link>
            <Link to="/interview" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-950">AI 面试</Link>
            <Link to="/market" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-950">面试官市场</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-8 flex items-center gap-3">
          <Link to="/home" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="eyebrow px-3 py-1.5">
              <Award size={15} />
              面试复盘报告
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">你的面试评估结果</h1>
          </div>
        </div>

        <div className={`mb-8 rounded-3xl border p-6 md:p-8 ${getScoreBg(report.score)}`}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">综合评分</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(report.score)}`}>{report.score}</span>
                <span className="text-lg font-semibold text-slate-400">/ 100</span>
              </div>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${getScoreColor(report.score)} bg-white/80`}>
                {getScoreLabel(report.score)}
              </span>
            </div>
            <div className="h-20 w-20">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(report.score / 100) * 97.4} 97.4`}
                  className={getScoreColor(report.score)}
                />
              </svg>
            </div>
          </div>
        </div>

        {report.evaluation && (
          <section className="surface mb-6 rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-800">总体评价</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600">{report.evaluation}</p>
          </section>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {report.weaknesses && report.weaknesses.length > 0 && (
            <section className="surface rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-800">薄弱环节</h2>
              </div>
              <ul className="space-y-3">
                {report.weaknesses.map((item, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-amber-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.suggestions && report.suggestions.length > 0 && (
            <section className="surface rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-teal-500" />
                <h2 className="text-lg font-semibold text-slate-800">改进建议</h2>
              </div>
              <ul className="space-y-3">
                {report.suggestions.map((item, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-teal-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-200 text-xs font-bold text-teal-700">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {report.resources && report.resources.length > 0 && (
          <section className="surface mt-6 rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800">推荐学习资源</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.resources.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <TrendingUp size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/interview" className="primary-button px-6 py-3 text-sm">
            再来一场面试
          </Link>
          <Link to="/home" className="secondary-button px-6 py-3 text-sm">
            返回题库
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Report;
