import { LanguageInfo } from '../types';

export const LANGUAGES: LanguageInfo[] = [
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    color: 'from-blue-500 to-yellow-500',
    description: 'High-level, interpreted language perfect for beginners',
  },
  {
    id: 'c',
    name: 'C',
    icon: '⚙️',
    color: 'from-gray-500 to-blue-600',
    description: 'Low-level systems programming language',
  },
];

export const DIFFICULTY_COLORS = {
  easy: 'text-neon-green',
  medium: 'text-neon-yellow',
  hard: 'text-neon-pink',
};

export const DIFFICULTY_BG = {
  easy: 'bg-green-500/10 border-green-500/30',
  medium: 'bg-yellow-500/10 border-yellow-500/30',
  hard: 'bg-pink-500/10 border-pink-500/30',
};

export const CODE_THEMES = {
  python: 'python',
  c: 'c',
} as const;

