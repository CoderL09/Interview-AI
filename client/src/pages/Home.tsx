import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
  Library,
  LogOut,
  Menu,
  MonitorSmartphone,
  Sparkles,
  X,
} from 'lucide-react';

interface Question {
  id: number;
  title: string;
  answer: string;
  tags: string;
}

interface Session {
  jti: string;
  device: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

const ALL_TAGS = [
  'algorithm', 'applet', 'css', 'design', 'git', 'http',
  'javascript', 'linux', 'nodejs', 'react', 'typescript', 'vue', 'webpack',
];

const PAGE_SIZES = [10, 20, 50];

const formatTime = (t: string) => {
  const d = new Date(t);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const Home = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setUserName(localStorage.getItem('userName') || '用户');
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      const response = await axios.get('/questions', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setQuestions(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedTags]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    onLogout();
    navigate('/login');
  };

  const openSessions = async () => {
    setSessionsOpen(true);
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.data || []);
    } catch {}
    setSessionsLoading(false);
  };

  const removeSession = async (jti: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/sessions/${jti}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions((prev) => prev.filter((s) => s.jti !== jti));
    } catch {}
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
            <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm">题库</span>
            <Link to="/interview" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-950">AI 面试</Link>
            <Link to="/market" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-950">面试官市场</Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button onClick={openSessions} className="secondary-button px-4 py-2 text-sm">
              <MonitorSmartphone size={16} />
              {userName}
            </button>
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
              <Link to="/interview" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">AI 面试</Link>
              <Link to="/market" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">面试官市场</Link>
              <button onClick={openSessions} className="secondary-button px-3 py-2 text-sm">设备管理</button>
              <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">退出登录</button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface rounded-3xl p-6 md:p-7">
            <div className="eyebrow px-3 py-1.5">
              <BookOpen size={15} />
              面试准备中心
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">高频题库与 AI 实战练习</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              先用题库补齐基础知识，再进入 AI 模拟面试训练表达、追问和复盘。筛选你关心的技术栈，快速定位薄弱项。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/interview" className="primary-button px-6 py-3.5">
                开始 AI 面试 <ArrowRight size={18} />
              </Link>
              <Link to="/market" className="secondary-button px-6 py-3.5">
                选择面试官风格
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['题目总览', questions.length || '-', '当前筛选结果'],
              ['已选标签', selectedTags.length, selectedTags.length ? selectedTags.join(', ') : '全部技术栈'],
              ['分页设置', `${pageSize} 条`, `第 ${currentPage} 页`],
            ].map(([title, value, desc]) => (
              <div key={title} className="surface rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
                <p className="mt-2 text-xs font-semibold text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 surface rounded-3xl p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    selectedTags.includes(tag)
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white/70 text-slate-500 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => { setSelectedTags([]); setCurrentPage(1); }}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  清除筛选
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-bold text-slate-400">每页</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="field w-auto px-3 py-2 text-xs font-bold"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} 条</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="surface rounded-3xl py-16 text-center text-sm font-semibold text-slate-400">加载题目中...</div>
          ) : questions.length === 0 ? (
            <div className="surface rounded-3xl py-16 text-center">
              <Library className="mx-auto text-slate-300" size={42} />
              <p className="mt-4 text-sm font-bold text-slate-500">暂无匹配题目</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                const open = expandedId === q.id;
                return (
                  <article key={q.id} className="surface overflow-hidden rounded-2xl">
                    <button onClick={() => setExpandedId(open ? null : q.id)} className="flex w-full items-start justify-between gap-4 p-5 text-left md:p-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
                          <Cpu size={14} />
                          面试题
                        </div>
                        <h3 className="mt-2 text-base font-semibold leading-7 text-slate-950 md:text-lg">{q.title}</h3>
                        {q.tags && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {q.tags.split(',').map((tag, i) => (
                              <span key={`${tag}-${i}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                        {open ? '收起' : '查看答案'}
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    {open && (
                      <div className="border-t border-slate-200/70 bg-white/60 px-5 pb-6 pt-5 md:px-6">
                        <div className="prose prose-sm max-w-none text-slate-600 prose-headings:text-slate-950 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-teal-700 prose-pre:bg-slate-950">
                          <ReactMarkdown>{q.answer}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="secondary-button px-4 py-2 text-sm disabled:opacity-40">
                <ArrowLeft size={16} />
                上一页
              </button>
              <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
                      page === currentPage ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:text-slate-950'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="secondary-button px-4 py-2 text-sm disabled:opacity-40">
                下一页
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>

      {sessionsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setSessionsOpen(false)} aria-label="关闭设备管理" />
          <div className="surface relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-[1.5rem]">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
              <div>
              <h3 className="text-base font-semibold text-slate-950">登录设备管理</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">查看和移除当前账号的登录会话</p>
              </div>
              <button onClick={() => setSessionsOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="thin-scrollbar flex-1 overflow-y-auto p-6">
              {sessionsLoading ? (
                <div className="py-10 text-center text-sm font-bold text-slate-400">加载中...</div>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center text-sm font-bold text-slate-400">暂无登录记录</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.jti} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{s.device || '未知设备'}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">IP: {s.ip || '-'}</p>
                          <p className="mt-1 text-xs text-slate-400">登录于 {formatTime(s.createdAt)}</p>
                          <p className="text-xs text-slate-400">过期于 {formatTime(s.expiresAt)}</p>
                        </div>
                        <button onClick={() => removeSession(s.jti)} className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50">
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
