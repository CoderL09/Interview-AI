import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import QuestionCard from '../components/QuestionCard';
import Pagination from '../components/Pagination';
import TagFilter from '../components/TagFilter';
import { useQuestions } from '../hooks/useQuestion';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function Home() {
  const { result, loading, page, totalPages, limit, setLimit, selectTag, setSelectTag, setPage } = useQuestions();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <Layout>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-10"
      >
        <h1 className="text-[28px] sm:text-[34px] font-bold text-[var(--color-text)] tracking-tight leading-tight">
          题库
        </h1>
      </motion.div>

      {/* Toolbar */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between gap-5 border-b border-[var(--color-border)] pb-5">
        <TagFilter currentTag={selectTag} onTagChange={setSelectTag} />
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[var(--color-text-secondary)]">每页</span>
          <div className="flex rounded-xl bg-[var(--color-input-bg)] p-0.5 ring-1 ring-[var(--color-border)]">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                  limit === n
                    ? 'bg-[var(--color-tag-active-bg)] text-[var(--color-tag-active-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="min-h-[300px]">
        {loading && (
          <div className="py-20 text-center text-[var(--color-text-secondary)] text-sm">
            <div className="inline-block w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p>加载中...</p>
          </div>
        )}
        {!loading && result.length === 0 && (
          <div className="py-20 text-center text-[var(--color-text-secondary)] text-sm">没有匹配的题目</div>
        )}
        {!loading && result.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {result.map((q, i) => (
              <motion.div
                key={q.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={cardVariants}
              >
                <QuestionCard
                  question={q}
                  isExpanded={expandedId === q.id}
                  onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                />
              </motion.div>
            ))}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
