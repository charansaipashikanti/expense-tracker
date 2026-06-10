import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ArrowLeftRight,
  PieChart,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  Home,
  CreditCard,
  FileText,
  Shield,
  Sun,
  Moon,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { getInitials, stringToColor } from '@/lib/utils';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/features/notifications/hooks';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Settlements', href: '/settlements', icon: ArrowLeftRight },
  { name: 'Rent', href: '/rent', icon: Home },
  { name: 'Budgets', href: '/budgets', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
];

const mobileNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Settlements', href: '/settlements', icon: ArrowLeftRight },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Scroll to top on page/route navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { data: notificationsData } = useNotifications(1, 5);
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const unreadCount = notificationsData?.unreadCount || 0;
  const recentNotifs = notificationsData?.items || [];

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Synchronize dark theme state with user preference on mount and user updates
  useEffect(() => {
    if (user?.preferences?.theme) {
      const theme = user.preferences.theme;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      } else if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
          setIsDark(true);
        } else {
          document.documentElement.classList.remove('dark');
          setIsDark(false);
        }
      }
    } else {
      // Default fallback to system preference if no user preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      }
    }
  }, [user?.preferences?.theme]);

  const toggleDarkMode = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
    }`;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">RoomSplit</h1>
          <p className="text-xs text-slate-400">Expense Tracker</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Menu
        </p>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={navLinkClass}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}

        {user?.role === 'superadmin' && (
          <>
            <div className="my-4 border-t border-slate-200 dark:border-slate-700/50" />
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Admin
            </p>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={navLinkClass}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Card */}
      <div className="mt-auto px-2 pt-4 border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold ${stringToColor(user?.name || '')}`}>
            {getInitials(user?.name || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[260px] lg:flex-col lg:bg-white lg:dark:bg-[#111118] lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:py-6">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="lg:pl-[260px]">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#111118]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile logo (hidden on desktop) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center shadow-md shadow-brand-500/20">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">RoomSplit</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center px-0.5 shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden py-1"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Recent Notifications</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => {
                                markAllRead.mutate();
                                setNotificationsOpen(false);
                              }}
                              className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-850">
                          {!recentNotifs || recentNotifs.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                              No notifications
                            </div>
                          ) : (
                            recentNotifs.map((notif) => (
                              <div
                                key={notif._id}
                                onClick={async () => {
                                  setNotificationsOpen(false);
                                  if (!notif.isRead) {
                                    await markAsRead.mutateAsync(notif._id);
                                  }
                                  if (notif.data?.groupId) {
                                    const tab = notif.type.includes('rent') ? 'rent' : notif.type.includes('budget') ? 'budgets' : notif.type.includes('settlement') ? 'balances' : 'expenses';
                                    navigate(`/groups/${notif.data.groupId}?tab=${tab}`);
                                  } else {
                                    navigate('/groups');
                                  }
                                }}
                                className={`px-4 py-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer flex gap-3 items-start ${
                                  notif.isRead ? '' : 'bg-brand-50/10 dark:bg-brand-500/5'
                                }`}
                              >
                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" style={{ opacity: notif.isRead ? 0 : 1 }} />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold text-slate-800 dark:text-slate-200 ${notif.isRead ? '' : 'font-bold text-slate-950 dark:text-white'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                                    {notif.message}
                                  </p>
                                  <span className="text-[9px] text-slate-400 block mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <Link
                          to="/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="block text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20"
                        >
                          View all notifications
                        </Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${stringToColor(user?.name || '')}`}>
                    {getInitials(user?.name || 'U')}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 z-50 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg py-2"
                      >
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-500/20 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 pb-20 lg:p-8 lg:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-35 bg-white/95 dark:bg-[#111118]/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/80 lg:hidden flex items-center justify-around h-16 pb-safe px-2 shadow-lg">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all ${
            mobileMenuOpen
              ? 'text-brand-600 dark:text-brand-400 scale-105'
              : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Menu Bottom Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            {/* Slide-up sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111118] border-t border-slate-200 dark:border-slate-800 rounded-t-2xl max-h-[75vh] overflow-y-auto p-6 pb-8 lg:hidden shadow-2xl"
            >
              {/* Grab handle */}
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">More Features</h4>
                  <p className="text-[11px] text-slate-450 mt-0.5">Explore additional room tracking tools</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Rent Tracking', href: '/rent', icon: Home },
                    { name: 'Category Budgets', href: '/budgets', icon: CreditCard },
                    { name: 'Expense Reports', href: '/reports', icon: FileText },
                    { name: 'Visual Analytics', href: '/analytics', icon: PieChart },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-2xl text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all flex flex-col gap-2 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-650 dark:group-hover:text-brand-450 transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
                  {user?.role === 'superadmin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                    >
                      <Shield className="w-5 h-5 text-slate-400" />
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                  >
                    <Settings className="w-5 h-5 text-slate-400" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
