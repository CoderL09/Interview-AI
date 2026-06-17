import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  LogOut,
  Menu,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import api from '../api';

interface Interviewer {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  creatorId: string;
}

const Market = () => {
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setUserName(localStorage.getItem('userName') || '用户');
    fetchInterviewers();
  }, [navigate]);

  const fetchInterviewers = async () => {
    try {
      const res = await api.get('/api/market/list');
      setInterviewers(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !promptTemplate) {
      setMessage('请填写完整信息');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/api/market/create',
        { name, description, promptTemplate },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName('');
      setDescription('');
      setPromptTemplate('');
      setShowForm(false);
      fetchInterviewers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage(error.response?.data?.message || '创建失败');
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="app-shell">
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
            <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm">面试官市场</span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm font-bold text-slate-400">{userName}</span>
            <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600">
              <LogOut size={16} />
            </button>
          </div>

          <button className="ml-auto rounded-xl p-2 text-slate-600 hover:bg-white md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="打开菜单">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200/70 bg-white/95 px-4 py-4 md:hidden">
            <div className="grid gap-2">
              <Link to="/home" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">题库</Link>
              <Link to="/interview" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">AI 面试</Link>
              <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">退出登录</button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <section className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div className="surface rounded-3xl p-6 md:p-7">
            <div className="eyebrow px-3 py-1.5">
              <Users size={15} />
              面试官风格市场
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">选择一个会追问的面试官</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              你可以使用社区创建的面试官风格，也可以定义自己的 Prompt 模板，让 AI 以特定公司、岗位或压力等级进行模拟。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setShowForm(!showForm)} className="primary-button px-6 py-3.5">
                <Plus size={18} />
                {showForm ? '收起表单' : '创建面试官'}
              </button>
              <Link to="/interview" className="secondary-button px-6 py-3.5">
                默认风格练习
              </Link>
            </div>
          </div>

          <div className="surface rounded-3xl bg-[#1d1d1f] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Style Examples</p>
            <div className="mt-6 space-y-4">
              {[
                ['压力追问型', '关注漏洞、边界条件和量化证明'],
                ['温和引导型', '适合第一次练习，帮助梳理表达结构'],
                ['系统设计型', '深入架构、性能、稳定性和取舍'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="text-teal-200" size={20} />
                    <h3 className="font-semibold text-white">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {showForm && (
          <section className="mt-6 surface rounded-3xl p-5 md:p-6">
            <form onSubmit={handleCreate} className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">面试官名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：阿里 P8 压力面"
                  className="field px-4 py-3"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">简短描述</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：关注工程深度和项目真实性"
                  className="field px-4 py-3"
                  disabled={submitting}
                />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Prompt 模板</label>
                <textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder="描述面试官的性格、提问风格、考察重点、追问强度..."
                  rows={5}
                  className="field resize-none px-4 py-3"
                  disabled={submitting}
                />
              </div>
              {message && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 lg:col-span-2">{message}</p>}
              <button type="submit" disabled={submitting} className="primary-button px-6 py-3.5 disabled:opacity-60 lg:col-span-2">
                {submitting ? '创建中...' : '提交面试官'}
              </button>
            </form>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-teal-700">热门面试官</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">选择风格后开始模拟</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">
              {interviewers.length} 个风格
            </span>
          </div>

          {loading ? (
            <div className="surface rounded-3xl py-16 text-center text-sm font-semibold text-slate-400">加载中...</div>
          ) : interviewers.length === 0 ? (
            <div className="surface rounded-3xl py-16 text-center">
              <Bot className="mx-auto text-slate-300" size={46} />
              <p className="mt-4 text-sm font-bold text-slate-500">暂无面试官，创建第一个风格吧</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {interviewers.map((item) => (
                <article key={item.id} className="surface flex min-h-56 flex-col justify-between rounded-2xl p-6 transition hover:-translate-y-0.5">
                  <div>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Bot size={22} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950">{item.name}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200/70 pt-4">
                    <span className="text-xs font-bold text-slate-400">{item.usageCount} 次挑战</span>
                    <Link to={`/interview?style=${item.id}`} className="primary-button px-4 py-2 text-xs">
                      开始 <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Market;
