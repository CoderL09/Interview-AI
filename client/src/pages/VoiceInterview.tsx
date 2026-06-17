import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Bot, Mic, PauseCircle, Sparkles, Square, Volume2 } from 'lucide-react';


interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const VoiceInterview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    audioRef.current = new Audio();
    if (sessionId) loadSession();
  }, [sessionId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/interview/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSessionStatus(data.data.status);
        const history: Message[] = (data.data.chatHistory || [])
          .filter((m: { role: string }) => m.role !== 'system')
          .map((m: Message) => ({ role: m.role, content: m.content }));
        setMessages(history);

        const lastAi = [...history].reverse().find((m) => m.role === 'assistant');
        if (lastAi) {
          setTimeout(() => speakText(lastAi.content), 500);
        }
      }
    } catch {}
  };

  const speakText = async (text: string) => {
    try {
      const token = localStorage.getItem('token');
      setSpeaking(true);
      const res = await fetch(`${API_URL}/api/audio/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audioRef.current.play();
      }
    } catch {
      setSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;
      recorder.start();
      setRecording(true);
    } catch {
      alert('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (blob.size === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const sttRes = await fetch(`${API_URL}/api/audio/stt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const sttData = await sttRes.json();
      const userText = sttData.data?.text || '';

      if (!userText.trim()) {
        setLoading(false);
        return;
      }

      const userMsg: Message = { role: 'user', content: userText };
      setMessages((prev) => [...prev, userMsg]);

      const answerRes = await fetch(`${API_URL}/api/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId, userAnswer: userText }),
      });

      const reader = answerRes.body?.getReader();
      const decoder = new TextDecoder();
      let aiReply = '';
      if (reader) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
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

      if (aiReply) setTimeout(() => speakText(aiReply), 300);
    } catch {
      alert('语音识别失败');
    }
    setLoading(false);
  };

  const endInterview = async () => {
    if (!sessionId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/interview/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) navigate('/home', { state: { report: data.data } });
    } catch {}
  };

  const lastAiMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </span>
            InterviewAI
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/interview" className="secondary-button px-3 py-2 text-xs">
              <ArrowLeft size={15} />
              文本模式
            </Link>
            <button onClick={endInterview} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100">
              结束
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1fr_24rem]">
        <section className="surface flex min-h-[70vh] flex-col items-center justify-center rounded-3xl p-6 text-center">
          <div className="relative">
            <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 transition duration-300 md:h-40 md:w-40 ${
              speaking ? 'scale-105 border-teal-300 bg-teal-50 shadow-2xl shadow-teal-200/60' : recording ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
            }`}>
              <Bot className={speaking ? 'text-teal-700' : recording ? 'text-rose-600' : 'text-slate-500'} size={58} />
            </div>
            {(speaking || recording) && <span className="absolute right-2 top-2 h-4 w-4 animate-ping rounded-full bg-teal-400" />}
          </div>

          <div className="mt-8 max-w-2xl">
            <div className="eyebrow mx-auto px-3 py-1.5">
              {speaking ? <Volume2 size={15} /> : recording ? <Mic size={15} /> : <Bot size={15} />}
              {speaking ? 'AI 正在提问' : recording ? '正在录音' : '语音模拟面试'}
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">开口回答，训练临场表达</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              按住麦克风开始回答，松开后系统会自动识别语音并提交给 AI 面试官。
            </p>
          </div>

          {lastAiMsg && (
            <div className="mt-7 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Current Question</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{lastAiMsg.content}</p>
              {!speaking && (
                <button onClick={() => speakText(lastAiMsg.content)} className="secondary-button mt-4 px-4 py-2 text-xs">
                  <Volume2 size={15} />
                  重新播放
                </button>
              )}
            </div>
          )}

          {sessionStatus === 'completed' ? (
            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">面试已结束</p>
              <button onClick={() => navigate('/home')} className="primary-button mt-3 px-5 py-2.5 text-sm">返回首页</button>
            </div>
          ) : (
            <div className="mt-8">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={() => { if (recording) stopRecording(); }}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={loading}
                className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 md:h-28 md:w-28 ${
                  recording ? 'bg-rose-500 shadow-rose-200' : loading ? 'bg-slate-300' : 'bg-[#1d1d1f] shadow-slate-200 hover:bg-black'
                }`}
                aria-label="按住录音"
              >
                {recording ? <PauseCircle size={42} /> : <Mic size={42} />}
              </button>
              <p className="mt-4 text-xs font-bold text-slate-400">
                {recording ? '正在录音，松开发送...' : loading ? 'AI 正在思考...' : '按住说话，松开发送'}
              </p>
            </div>
          )}
        </section>

        <aside className="surface flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl">
          <div className="border-b border-slate-200/70 p-5">
            <h2 className="text-lg font-semibold text-slate-950">对话记录</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">{messages.length} 条消息</p>
          </div>
          <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">暂无对话</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`rounded-2xl p-3 text-sm leading-6 ${
                  msg.role === 'user' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}>
                  <span className="mb-1 block text-xs font-semibold opacity-60">{msg.role === 'user' ? '我' : 'AI 面试官'}</span>
                  {msg.content || '思考中...'}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <button onClick={endInterview} className="m-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100">
            <Square size={16} className="inline" />
            <span className="ml-2">结束并生成报告</span>
          </button>
        </aside>
      </main>
    </div>
  );
};

export default VoiceInterview;
