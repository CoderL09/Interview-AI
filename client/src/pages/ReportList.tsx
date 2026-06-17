import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Bot,
  ChevronRight,
  Clock,
  LogOut,
  Menu,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import api from '../api';

interface ReportItem {
  id: string;
  roleName: string;
  interviewStyle: string;
  status: string;
  score: number;
  createdAt: string;
}

const formatDate = (t: string) => {
  const d = new Date(t);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ReportList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setUserName(localStorage.getItem('userName') || '用户');
    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data.data || []);
    } catch {}
    setLoading(false);
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
            <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm">报告</span>
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
              <Link to="/market" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">面试官市场</Link>
              <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">退出登录</button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-8 flex items-center gap-3">
          <Link to="/home" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="eyebrow px-3 py-1.5">
              <Award size={15} />
              面试报告
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">你的面试复盘记录</h1>
          </div>
        </div>

        {loading ? (
          <div className="surface rounded-3xl py-16 text-center text-sm font-semibold text-slate-400">加载中...</div>
        ) : reports.length === 0 ? (
          <div className="surface rounded-3xl py-16 text-center">
            <TrendingUp className="mx-auto text-slate-300" size={48} />
            <p className="mt-4 text-sm font-bold text-slate-500">暂无面试报告</p>
            <p className="mt-2 text-xs text-slate-400">完成一场模拟面试后，报告会出现在这里</p>
            <Link to="/interview" className="primary-button mt-6 inline-flex px-6 py-3 text-sm">
              开始面试
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/report/${report.id}`}
                className="surface flex items-center gap-5 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Bot size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-950 truncate">{report.roleName || '未命名面试'}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(report.createdAt)}
                    </span>
                    <span>{report.interviewStyle}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${report.score >= 85 ? 'text-teal-600' : report.score >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {report.score ?? '-'}
                    </div>
                    <div className="text-xs font-semibold text-slate-400">分</div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportList;
