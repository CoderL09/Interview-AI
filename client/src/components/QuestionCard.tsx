import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Question {
  id: number;
  title: string;
  answer: string;
  tags: string;
}

interface QuestionCardProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function QuestionCard({ question, isExpanded, onToggle }: QuestionCardProps) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
        isExpanded
          ? 'border-[var(--color-expanded-border)] bg-[var(--color-expanded-bg)]'
          : 'border-[var(--color-card-border)] bg-[var(--color-card-bg)] hover:border-[var(--color-card-border-hover)] hover:bg-[var(--color-card-bg-hover)]'
      }`}
    >
      <div className="flex items-start justify-between p-5 md:p-6">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-md bg-[var(--color-tag-badge-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-tag-badge-text)]">
            {question.tags}
          </span>
          <motion.h2
            layout="position"
            className={`text-[15px] font-semibold leading-snug md:text-base transition-colors ${
              isExpanded ? 'text-[var(--color-text)]' : 'text-[var(--color-text)] group-hover:text-[var(--color-text)]'
            }`}
          >
            {question.title}
          </motion.h2>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-1 ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="border-t border-[var(--color-border)] bg-[var(--color-answer-bg)] p-5 md:p-6">
              <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                解析
              </div>
              <div className="prose prose-zinc max-w-none text-[14px] leading-relaxed prose-headings:font-semibold prose-a:text-[var(--color-link)] prose-code:rounded-md prose-code:bg-[var(--color-code-bg)] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:text-[var(--color-text)] prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-[var(--color-border)] prose-strong:text-[var(--color-text)] dark:prose-invert">
                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {question.answer || '*暂无解析内容*'}
                </Markdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
