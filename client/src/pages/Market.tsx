import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Sword, Plus, X, Loader2 } from 'lucide-react';

interface Interviewer {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  creatorId: string;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function Market() {
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('accessToken');

  const fetchMarketList = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/market/list');
      const data = await res.json();
      if (data.success) setInterviewers(data.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchMarketList();
  }, []);

  const handleCreate = async () => {
    if (!name || !description || !promptTemplate) {
      alert('请填写完整信息');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/market/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, promptTemplate }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setPromptTemplate('');
        fetchMarketList();
      } else {
        alert(data.message || '创建失败');
      }
    } catch {
      alert('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] max-w-6xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--color-btn-primary)]">
              <Sword size={15} className="text-[var(--color-btn-primary-text)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">面试官集市</h1>
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            挑战社区创造的 AI 面试官，或创造属于你自己的
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-btn-primary)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-btn-primary-text)] hover:opacity-90 transition-all"
        >
          <Plus size={15} />
          创造面试官
        </motion.button>
      </motion.div>

      {interviewers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-5xl mb-4"
          >
            🤖
          </motion.div>
          <p className="text-[var(--color-text-secondary)]">暂无面试官，快来创造第一个吧</p>
        </div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {interviewers.map((item) => (
            <motion.div
              key={item.id}
              variants={cardVariant}
              layout
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] hover:border-[var(--color-card-border-hover)] hover:bg-[var(--color-card-bg-hover)] transition-colors cursor-pointer p-5 flex flex-col"
              onClick={() => navigate(`/interview?interviewerId=${item.id}`)}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--color-tag-hover-bg)] text-sm">
                    🎯
                  </div>
                  <h2 className="text-[15px] font-bold text-[var(--color-text)] line-clamp-1">
                    {item.name}
                  </h2>
                </div>
                <Sparkles size={14} className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mb-4 flex-1">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-text-secondary)]">
                  <TrendingUp size={12} />
                  挑战 {item.usageCount} 次
                </span>
                <span className="text-[13px] font-semibold text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  挑战 Ta
                  <Sword size={12} />
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Sparkles size={17} className="text-[var(--color-primary)]" />
                  <h2 className="text-[16px] font-bold text-[var(--color-text)]">创造你的 AI 面试官</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-tag-hover-bg)] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">面试官名号</label>
                  <input
                    type="text"
                    placeholder="例如：阿里P8毒舌考官"
                    className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-input-focus-border)] transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">一句话简介</label>
                  <input
                    type="text"
                    placeholder="例如：专治各种不服，疯狂深挖底层原理..."
                    className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-input-focus-border)] transition-all"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text)] mb-1.5">核心人设 Prompt</label>
                  <textarea
                    rows={5}
                    placeholder="例如：你是一位资深架构师，面试极其严格..."
                    className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-input-focus-border)] transition-all resize-none"
                    value={promptTemplate}
                    onChange={(e) => setPromptTemplate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 p-5 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-tag-hover-bg)] transition-all"
                >
                  取消
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-btn-primary)] px-5 py-2 text-[13px] font-semibold text-[var(--color-btn-primary-text)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '确认创建'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
