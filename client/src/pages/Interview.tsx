import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileUp,
  LogOut,
  Menu,
  Mic,
  Send,
  Sparkles,
  Square,
  X,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Interview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interviewerId = searchParams.get('style') || '';
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [roleName, setRoleName] = useState('');
  const [interviewStyle, setInterviewStyle] = useState(interviewerId ? '使用已选面试官风格' : '温和引导，逐步加压');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setUserName(localStorage.getItem('userName') || '用户');
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('${API_URL}/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('退出登录请求失败', err);
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  const startInterview = async () => {
    if (!resumeFile) {
      alert('请先上传 PDF 简历');
      return;
    }
    if (!roleName.trim() || !interviewStyle.trim()) {
      alert('请填写目标岗位和面试风格');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('roleName', roleName.trim());
    formData.append('interviewStyle', interviewStyle.trim());
    if (interviewerId) {
      formData.append('interviewerId', interviewerId);
    }

    try {
      const res = await fetch('${API_URL}/api/interview/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: `请求失败 (${res.status})` }));
        alert(errData.message || '启动面试失败');
        setUploading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let sid = '';
      let firstMsg = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.sessionId) {
                  sid = parsed.sessionId;
                  setSessionId(sid);
                }
                if (parsed.content) {
                  firstMsg += parsed.content;
                  setMessages([{ role: 'assistant', content: firstMsg }]);
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      alert('网络错误');
    } finally {
      setUploading(false);
    }
  };

  const submitAnswer = async () => {
    if (!input.trim() || !sessionId || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    const answerText = input;
    setInput('');
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('${API_URL}/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId, userAnswer: answerText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: '请求失败' }));
        if (response.status === 403) {
          alert(errData.message || '今日额度已用完');
        } else {
          alert(errData.message || `请求失败 (${response.status})`);
        }
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiReply = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  aiReply += parsed.content;
                  setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: 'assistant', content: aiReply };
                    return copy;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      alert('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    if (!sessionId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('${API_URL}/api/interview/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || `请求失败 (${res.status})`);
        return;
      }
      if (data.success) {
        navigate('/home', { state: { report: data.data } });
      }
    } catch {
      alert('结束失败，请检查网络');
    }
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
            <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm">AI 面试</span>
            <Link to="/market" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-950">面试官市场</Link>
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
              <Link to="/market" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">面试官市场</Link>
              <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">退出登录</button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {!sessionId ? (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="surface rounded-3xl p-6 md:p-7">
              <div className="eyebrow px-3 py-1.5">
                <Bot size={15} />
                AI 模拟面试
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">上传简历，开始一场真实追问</h1>
              <p className="mt-5 text-base leading-7 text-slate-600">
                系统会读取你的 PDF 简历，结合目标岗位生成第一轮问题。回答后，AI 会根据你的细节继续追问。
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {['简历理解', '连续追问', '报告复盘'].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface rounded-3xl p-5 md:p-6">
              <div className="space-y-5">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
                  <label className="mb-3 block text-sm font-semibold text-slate-800">上传简历 PDF</label>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="secondary-button w-full px-5 py-4">
                    <FileUp size={20} />
                    {resumeFile ? resumeFile.name : '选择 PDF 简历'}
                  </button>
                  <p className="mt-3 text-xs font-semibold text-slate-400">建议使用包含项目经历、技术栈和实习经历的简历。</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">目标岗位</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="例如：前端开发工程师"
                    disabled={uploading}
                    className="field px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">面试风格</label>
                  <textarea
                    value={interviewStyle}
                    onChange={(e) => setInterviewStyle(e.target.value)}
                    placeholder="例如：温和引导、压力追问、技术深挖"
                    disabled={uploading || Boolean(interviewerId)}
                    rows={4}
                    className="field resize-none px-4 py-3"
                  />
                </div>

                <button onClick={startInterview} disabled={uploading} className="primary-button w-full px-6 py-3.5 disabled:opacity-60">
                  {uploading ? '启动中...' : '开始面试'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid min-h-[calc(100vh-7rem)] gap-6 lg:grid-cols-[20rem_1fr]">
            <aside className="surface rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Bot size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">面试进行中</p>
                  <p className="text-xs font-semibold text-slate-400">Session {sessionId.slice(0, 8) || 'active'}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">目标岗位</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{roleName || '未设置'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">对话轮次</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{messages.length} 条消息</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <button onClick={() => navigate(`/voice-interview?session=${sessionId}`)} className="secondary-button px-4 py-3 text-sm">
                  <Mic size={17} />
                  语音模式
                </button>
                <button onClick={endInterview} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100">
                  <Square size={16} className="inline" />
                  <span className="ml-2">结束并生成报告</span>
                </button>
              </div>
            </aside>

            <div className="surface flex min-h-[70vh] flex-col overflow-hidden rounded-3xl">
              <div className="border-b border-slate-200/70 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">实时问答</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">按 Enter 发送，Shift + Enter 换行</p>
              </div>

              <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 md:p-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-7 md:max-w-[76%] ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-slate-950 text-white'
                        : 'rounded-tl-sm border border-slate-200 bg-white text-slate-700'
                    }`}>
                      {msg.content || '思考中...'}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-200/70 bg-white/80 p-4">
                <div className="flex gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitAnswer();
                      }
                    }}
                    placeholder="输入你的回答..."
                    rows={2}
                    disabled={loading}
                    className="field resize-none px-4 py-3"
                  />
                  <button onClick={submitAnswer} disabled={loading || !input.trim()} className="primary-button shrink-0 px-5 py-3 disabled:opacity-50" aria-label="发送回答">
                    <Send size={19} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Interview;
