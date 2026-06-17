import type { FC } from 'react';

interface TextTypeProps {
  text?: string[];
  texts?: string[];
  as?: string;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  textColors?: string[];
  variableSpeed?: boolean;
  variableSpeedEnabled?: boolean;
  variableSpeedMin?: number;
  variableSpeedMax?: number;
  onSentenceComplete?: () => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

declare const TextType: FC<TextTypeProps>;
export default TextType;
