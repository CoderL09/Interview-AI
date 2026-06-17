import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Menu,
  MessageSquareText,
  Mic,
  Sparkles,
  X,
} from 'lucide-react';

const stats = [
  { label: '模拟场次', value: '12k+' },
  { label: '追问维度', value: '38' },
  { label: '报告指标', value: '9项' },
];

const features = [
  {
    icon: FileText,
    title: '简历驱动提问',
    text: '上传 PDF 简历后，AI 会围绕项目经历、技术栈和岗位目标生成贴近真实面试的开场问题。',
  },
  {
    icon: BrainCircuit,
    title: '动态追问压力',
    text: '根据你的回答继续追问细节、边界条件、量化结果和取舍原因，避免只背标准答案。',
  },
  {
    icon: BarChart3,
    title: '结构化复盘',
    text: '面试结束后输出表达清晰度、逻辑闭环、专业深度等评分和可执行改进建议。',
  },
];

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </span>
            InterviewAI
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 md:flex"></div>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="secondary-button px-4 py-2 text-sm">登录</Link>
            <Link to="/register" className="primary-button px-5 py-2 text-sm">
              免费开始 <ArrowRight size={16} />
            </Link>
          </div>

          <button
            className="ml-auto rounded-xl p-2 text-slate-600 hover:bg-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开菜单"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200/70 bg-white/95 px-4 py-4 md:hidden">
            <div className="grid gap-2">
              <Link to="/login" className="secondary-button mt-2 px-4 py-2 text-sm">登录</Link>
              <Link to="/register" className="primary-button px-4 py-2 text-sm">免费开始</Link>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-[1.02fr_0.98fr] md:px-8 md:py-16">
          <div>
            <div className="eyebrow px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              面向求职者的 AI 模拟面试工作台
            </div>
            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 md:text-5xl">
              把每一次练习都变成真实面试预演
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              InterviewAI 基于简历、目标岗位和面试官风格进行连续追问，帮你发现回答中的漏洞、补齐论证链路，并生成可复盘的评分报告。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="primary-button px-5 py-3 text-sm">
                开始模拟面试 <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="secondary-button px-5 py-3 text-sm">
                进入控制台
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="surface rounded-2xl p-4">
                  <div className="text-xl font-semibold text-slate-950">{item.value}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="demo" className="surface relative overflow-hidden rounded-3xl p-4 md:p-5">
            <div className="rounded-2xl bg-[#1d1d1f] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Live Interview</p>
                  <h2 className="mt-2 text-xl font-bold">前端工程师一面</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  追问中
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-200">
                    <MessageSquareText size={19} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm leading-6 text-slate-100">
                    你提到把首屏加载从 3.2s 优化到 1.6s。请说明你如何定位瓶颈，以及哪些优化是可量化验证的？
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-white p-4 text-sm leading-6 text-slate-800">
                    我先用 Lighthouse 和 Performance 面板确认长任务来源，然后拆分首屏包体、延迟加载非核心模块，并用 RUM 监控验证。
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 text-amber-200" size={18} />
                    <p className="text-sm leading-6 text-amber-50">
                      AI 检测到回答缺少实验分组和业务指标，下一轮将追问“如何排除缓存、网络波动和同期发布影响”。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="report" className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ['逻辑闭环', '86%', 'bg-teal-500'],
                ['表达清晰', '78%', 'bg-indigo-500'],
                ['专业深度', '91%', 'bg-slate-900'],
              ].map(([label, value, color]) => (
                <div key={label} className="surface-muted rounded-2xl p-4">
                  <div className="text-xs font-bold text-slate-500">{label}</div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-xl font-semibold text-slate-950">{value}</span>
                    <span className={`h-10 w-2 rounded-full ${color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-slate-200/70 bg-white/55 py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-teal-700">从准备到复盘</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">为 AI 模拟面试而设计的完整流程</h2>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="surface rounded-2xl p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <div className="eyebrow px-3 py-1.5">
              <Mic size={15} />
              支持文本与语音模式
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">像真实面试一样开口回答</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              你可以用文本精修表达，也可以切换语音模式训练临场表达。系统会保留上下文，持续推进问题难度。
            </p>
          </div>
          <div className="surface rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {['岗位匹配提问', '面试官风格市场', '追问强度调节', '复盘报告输出'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <CheckCircle2 className="text-teal-600" size={20} />
                  <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="primary-button mt-6 w-full px-6 py-3.5">
              创建账号，开始第一场模拟 <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
