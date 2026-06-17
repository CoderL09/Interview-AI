import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { ArrowRight, KeyRound, Mail, ShieldCheck, Sparkles } from 'lucide-react';

const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');

  const handleSendLoginCode = async () => {
    if (!email) {
      setMessage('请先输入邮箱');
      return;
    }
    setSending(true);
    setMessage('');
    try {
      await axios.post('/send-login-code', { email });
      setMessage('验证码已发送，请查收邮件');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = mode === 'password'
        ? await axios.post('/pass-login', { email, password })
        : await axios.post('/code-login', { email, code });

      if (response.data.success) {
        const token = response.data.accessToken;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', response.data.userId);
        if (response.data.userName || response.data.username) {
          localStorage.setItem('userName', response.data.userName || response.data.username);
        }
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        onLogin(token);
        navigate('/home');
      } else {
        setMessage(response.data.message || '登录失败，请重试');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const success = message.includes('已发送');

  return (
    <main className="app-shell grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl surface md:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-[#1d1d1f] p-10 text-white md:flex md:flex-col md:justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
              <Sparkles size={19} />
            </span>
            InterviewAI
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-teal-100">
              <ShieldCheck size={14} />
              安全登录
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight">
              回到你的模拟面试工作台
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              继续练习岗位问题、查看历史报告，并使用不同面试官风格训练临场表达。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {['简历追问', '语音训练', '报告复盘'].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 px-3 py-4 text-xs font-bold text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <Link to="/" className="mb-8 flex items-center gap-2 font-semibold text-slate-950 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </span>
            InterviewAI
          </Link>
          <div>
            <p className="text-sm font-bold text-teal-700">欢迎回来</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">登录账号</h2>
            <p className="mt-2 text-sm text-slate-500">选择密码或邮箱验证码登录。</p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setMode('password'); setMessage(''); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'password' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
            >
              <KeyRound size={16} />
              密码登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('code'); setMessage(''); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'code' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
            >
              <Mail size={16} />
              验证码
            </button>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">邮箱</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                className="field px-4 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {mode === 'password' ? (
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">密码</label>
                <input
                  type="password"
                  id="password"
                  placeholder="请输入密码"
                  className="field px-4 py-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-700">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="code"
                    placeholder="6 位验证码"
                    maxLength={6}
                    className="field px-4 py-3"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    disabled={sending || countdown > 0}
                    onClick={handleSendLoginCode}
                    className="secondary-button shrink-0 px-4 py-3 text-sm disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${success ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-600'}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="primary-button w-full px-6 py-3.5 disabled:opacity-60">
              {loading ? '登录中...' : '登录'} <ArrowRight size={18} />
            </button>

            <p className="text-center text-sm text-slate-500">
              还没有账号？
              <Link to="/register" className="ml-1 font-bold text-slate-950 hover:text-teal-700">
                立即注册
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Login;
