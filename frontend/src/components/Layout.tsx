import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  ArrowLeftRight,
  CalendarDays,
  Search,
  LogOut,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Cpu className="size-[18px]" />
          </span>
          <span className="text-lg font-bold text-white">AdminHub</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user?.fullName ?? 'A'} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.fullName}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand-600 text-white">
              <Cpu className="size-4" />
            </span>
            <span className="font-bold">AdminHub</span>
          </div>
          <div className="relative ml-auto hidden w-72 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input h-9 pl-9"
              placeholder="Search console..."
              disabled
            />
          </div>
          <div className="ml-auto md:ml-0">
            <NotificationBell />
          </div>
          <div className="md:hidden">
            <Avatar name={user?.fullName ?? 'A'} size={32} />
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-400"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </nav>
    </div>
  );
}
