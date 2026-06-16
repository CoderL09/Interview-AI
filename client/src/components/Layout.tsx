import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Sparkles, BookOpen, Store } from 'lucide-react';

const navItems = [
  { to: '/home', label: '题库', icon: BookOpen },
  { to: '/interview', label: 'AI 面试', icon: Sparkles },
  { to: '/market', label: '集市', icon: Store },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-[var(--color-header-bg)] backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-8">
          <NavLink to="/home" className="flex items-center gap-2 group">
            <span className="text-sm font-semibold tracking-tight text-[var(--color-text)] group-hover:opacity-80 transition-opacity">
              InterviewHub
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 text-[13px]">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-tag-active-bg)] text-[var(--color-tag-active-text)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-tag-hover-bg)]'
                  }`
                }
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}

            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

            <button
              onClick={toggleTheme}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-tag-hover-bg)] transition-all"
              title={theme === 'dark' ? '切换日间模式' : '切换夜间模式'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={handleLogout}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-[var(--color-tag-hover-bg)] transition-all"
              title="退出登录"
            >
              <LogOut size={15} />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14 md:py-20">
        {children}
      </main>
    </div>
  );
}
