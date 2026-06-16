import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

type LoginMode = 'password' | 'code';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<LoginMode>('password');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSendCode = async () => {
    if (isSending || countdown > 0) return;
    setIsSending(true);
    try {
      const response = await axios.post(`${API_BASE}/send-login-code`, { email });
      if (response.status === 200) {
        alert(response.data.message || '验证码已发送');
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '发送失败');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    try {
      let response;
      if (mode === 'password') {
        response = await axios.post(`${API_BASE}/pass-login`, { email, password });
      } else {
        response = await axios.post(`${API_BASE}/code-login`, { email, code });
      }
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userId', response.data.userId);
        navigate('/home');
      } else {
        alert(response.data.message || '登录失败');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '登录失败');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-tag-hover-bg)] transition-all z-50"
        title={theme === 'dark' ? '日间模式' : '夜间模式'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">登录</h1>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6">
          <div className="flex rounded-lg bg-[var(--color-input-bg)] p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode('password'); setCode(''); setPassword(''); }}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                mode === 'password'
                  ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-primary-text)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              密码登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('code'); setCode(''); setPassword(''); }}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                mode === 'code'
                  ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-primary-text)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              验证码登录
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">邮箱</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" required
                className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-input-focus-border)] transition-all" />
            </div>

            {mode === 'password' && (
              <div>
                <label htmlFor="password" className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">密码</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码" required
                  className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-input-focus-border)] transition-all" />
              </div>
            )}

            {mode === 'code' && (
              <div>
                <label htmlFor="code" className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">验证码</label>
                <div className="flex gap-2">
                  <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="输入验证码" required
                    className="flex-1 rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-input-focus-border)] transition-all" />
                  <button type="button" onClick={handleSendCode} disabled={isSending || countdown > 0}
                    className="shrink-0 rounded-lg bg-[var(--color-btn-primary)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-btn-primary-text)] hover:opacity-90 disabled:bg-[var(--color-btn-disabled)] disabled:text-[var(--color-btn-disabled-text)] disabled:cursor-not-allowed transition-all">
                    {countdown > 0 ? `${countdown}s` : '发送'}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLogging}
              className="w-full rounded-lg bg-[var(--color-btn-primary)] py-2.5 text-[14px] font-semibold text-[var(--color-btn-primary-text)] hover:opacity-90 disabled:bg-[var(--color-btn-disabled)] disabled:text-[var(--color-btn-disabled-text)] disabled:cursor-not-allowed transition-all">
              {isLogging ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[var(--color-text-secondary)] mt-5">
            还没有账号？<a href="/register" className="text-[var(--color-link)] hover:underline ml-1">立即注册</a>
          </p>
        </div>
      </div>
    </div>
  );
}
