import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  once?: boolean;
}

export default function SplitText({
  text,
  className = '',
  delay = 40,
  duration = 0.6,
  tag: Tag = 'p',
  once = true
}: SplitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-80px' });

  const chars = text.split('');

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: delay / 1000 },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 30, rotateX: -40 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <Tag ref={ref} className={`inline-flex flex-wrap ${className}`} style={{ perspective: '400px' }}>
      <motion.span
        className="inline-flex flex-wrap"
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        style={{ display: 'inline' }}
      >
        {chars.map((char, i) => (
          <motion.span
            key={i}
            variants={child}
            className="inline-block"
            style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
