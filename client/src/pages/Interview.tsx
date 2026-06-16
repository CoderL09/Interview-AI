import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function Interview() {
  const [searchParams] = useSearchParams();
  const interviewerId = searchParams.get('interviewerId');

  // --- 表单与基本状态 ---
  const [roleName, setRoleName] = useState('前端开发工程师');
  const [interviewStyle, setInterviewStyle] = useState('压力面试，指出不足');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- 🌟 语音录制核心 Ref 状态 ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    } else {
      setResumeFile(null);
    }
  };

  // ---播放 AI 声音工具函数 (TTS) ---
  const playAiVoice = async (textToSpeak: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSpeak })
      });

      if (!res.ok) throw new Error('语音合成失败');

      // 接收后端传回的二进制 MP3 数据并播放
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('播放 AI 语音失败:', error);
    }
  };

  // 1. 启动面试
  const handleStartInterview = async () => {
    if (!resumeFile) return alert('请先上传简历 PDF！');
    const token = localStorage.getItem('token');
    if (!token) return alert('请先登录！');

    setIsLoading(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    
    if (interviewerId) {
      formData.append('interviewerId', interviewerId);
    } else {
      formData.append('roleName', roleName);
      formData.append('interviewStyle', interviewStyle);
    }

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSessionId(data.data.sessionId);
        setMessages([{ role: 'assistant', content: data.data.firstQuestion }]);
        
        // 🌟 亮点：AI 出来的第一句话，直接让面试官“开口说话”
        playAiVoice(data.data.firstQuestion);
      } else {
        alert(data.message || '启动失败');
      }
    } catch (error) {
      console.error(error);
      alert('启动失败，请检查服务');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 核心通用的“发送回答与接收流式文本”工作流
  const sendAnswerWorkflow = async (textToSend: string) => {
    if (!textToSend.trim() || !sessionId) return;

    // 显示用户回答，并为 AI 预先占位
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    setIsLoading(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ sessionId, userAnswer: textToSend }),
      });

      if (!res.ok) {
        alert('服务器响应失败');
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedAiAnswer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') break;
              
              try {
                const parsedData = JSON.parse(dataStr);
                if (parsedData.content) {
                  accumulatedAiAnswer += parsedData.content;
                  // 实时打字机渲染文本
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages];
                    newMessages[newMessages.length - 1].content = accumulatedAiAnswer;
                    return newMessages;
                  });
                }
              } catch (e) {
                // 部分截断忽略
              }
            }
          }
        }
        
        // 🌟 亮点：当文本流式完全加载完毕后，立刻把完整的追问文本丢给 TTS 播放
        if (accumulatedAiAnswer) {
          playAiVoice(accumulatedAiAnswer);
        }
      }
    } catch (error) {
      console.error(error);
      alert('网络连接中断');
    } finally {
      setIsLoading(false);
    }
  };

  // 打字模式的普通发送
  const handleSendTextAnswer = () => {
    if (!inputText.trim()) return;
    sendAnswerWorkflow(inputText);
    setInputText('');
  };

  // --- 👂 录音控制逻辑 (STT) ---
  const startRecording = async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 录音结束触发：打包音频文件上传后端 STT
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsLoading(true);

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'user-answer.wav');

        try {
          // 调用后端的语音转文字接口
          const res = await fetch('/api/audio/stt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();

          if (data.success && data.data.text) {
            // 🌟 亮点：识别出说话的文本后，免去手动点击，直接自动触发发送回答工作流！
            sendAnswerWorkflow(data.data.text);
          } else {
            alert(data.message || '没听清您说了什么，请重试');
            setIsLoading(false);
          }
        } catch (err) {
          console.error(err);
          alert('音频上传识别失败');
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('无法打开麦克风:', err);
      alert('无法获取麦克风权限，请检查浏览器设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // 关闭麦克风硬件占用
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendTextAnswer();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md mt-10 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">🎤 AI 全真语音模拟面试</h1>

      {!sessionId ? (
        <div className="space-y-4 border p-6 rounded bg-gray-50">
          {interviewerId ? (
            <div className="p-4 bg-blue-100 text-blue-800 rounded-md mb-4 font-bold">
              ⚔️ 您正在挑战集市中的自定义面试官！(已开启全真语音交互)
            </div>
          ) : (
            <>
              <div>
                <label className="block mb-1 font-semibold">面试岗位：</label>
                <input type="text" className="w-full border p-2 rounded" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 font-semibold">面试风格：</label>
                <input type="text" className="w-full border p-2 rounded" value={interviewStyle} onChange={(e) => setInterviewStyle(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label className="block mb-1 font-semibold">上传简历 (PDF)：</label>
            <input type="file" accept=".pdf" className="w-full border p-2 rounded bg-white" onChange={handleFileChange} />
          </div>
          
          <button onClick={handleStartInterview} disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? 'AI 正在阅读简历并准备发言...' : '开启语音面试'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[600px] border rounded bg-gray-50">
          {/* 聊天记录显示区 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-[70%] ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border text-gray-800'}`}>
                  {msg.content || <span className="text-gray-400 animate-pulse">AI 正在组织语言...</span>}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-500 text-sm animate-pulse">AI 面试官正在聆听/思考中...</div>}
          </div>

          {/* 底部交互区：融合了文字输入和语音录制 */}
          <div className="p-4 border-t bg-white flex items-center gap-3">
            
            {/* 语音按钮：按住/点击录音 */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording} // 兼容移动端
              onTouchEnd={stopRecording}
              className={`px-4 py-2 rounded-full font-bold text-white transition-all select-none ${
                isRecording 
                  ? 'bg-red-500 scale-105 animate-pulse shadow-lg' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isRecording ? '🛑 松开 结束发言' : '🎤 按住 语音回答'}
            </button>

            <div className="text-gray-300">|</div>

            {/* 文字备用输入框 */}
            <input 
              type="text" 
              className="flex-1 border p-2 rounded bg-gray-50 focus:bg-white" 
              placeholder="也可以在这里打字回复..." 
              value={inputText} 
              disabled={isRecording}
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyDown} 
            />
            <button 
              onClick={handleSendTextAnswer} 
              disabled={isLoading || !inputText.trim() || isRecording} 
              className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}