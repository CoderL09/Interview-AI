import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Mail, Sparkles, UserPlus } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!email) {
      setMessage('请先输入邮箱');
      return;
    }
    setSending(true);
    setMessage('');
    try {
      await axios.post('/send-code', { email });
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
      const response = await axios.post('/register', {
        username,
        email,
        password,
        code,
      });

      if (response.data.success) {
        navigate('/login');
      } else {
        setMessage(response.data.message || '注册失败，请重试');
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
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl surface md:grid-cols-[1.05fr_0.95fr]">
        <section className="p-6 sm:p-10">
          <Link to="/" className="mb-8 flex items-center gap-2 font-semibold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </span>
            InterviewAI
          </Link>
          <div>
            <div className="eyebrow px-3 py-1.5">
              <UserPlus size={15} />
              创建训练账号
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">开始你的第一场 AI 模拟面试</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">注册后即可上传简历、选择岗位并生成个性化面试问题。</p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">用户名</label>
              <input
                type="text"
                id="username"
                placeholder="例如：前端求职者"
                className="field px-4 py-3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

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

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">密码</label>
              <input
                type="password"
                id="password"
                placeholder="至少 8 位，建议包含字母和数字"
                className="field px-4 py-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-700">邮箱验证码</label>
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
                  onClick={handleSendCode}
                  className="secondary-button shrink-0 px-4 py-3 text-sm disabled:opacity-50"
                >
                  <Mail size={16} />
                  {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '获取'}
                </button>
              </div>
            </div>

            {message && (
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${success ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-600'}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="primary-button w-full px-6 py-3.5 disabled:opacity-60">
              {loading ? '注册中...' : '创建账号'} <ArrowRight size={18} />
            </button>

            <p className="text-center text-sm text-slate-500">
              已有账号？
              <Link to="/login" className="ml-1 font-bold text-slate-950 hover:text-teal-700">
                立即登录
              </Link>
            </p>
          </form>
        </section>

        <section className="hidden bg-[#1d1d1f] p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Practice Flow</p>
            <div className="mt-6 space-y-4">
              {['上传 PDF 简历', '选择目标岗位', '进行连续追问', '获得复盘报告'].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-slate-100">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">练习不只是刷题，而是复现真实压力。</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              通过角色、风格、语音和报告，把面试前最难模拟的临场感补上。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-sm font-bold text-slate-100">
            <CheckCircle2 className="text-teal-300" size={20} />
            注册后即可进入控制台
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
