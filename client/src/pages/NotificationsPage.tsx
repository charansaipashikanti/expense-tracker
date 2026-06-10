import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Receipt,
  ArrowLeftRight,
  Shield,
  CreditCard,
  Users,
  Calendar,
  Sparkles,
  Inbox,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead
} from '@/features/notifications/hooks';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: notificationsData, isLoading } = useNotifications(page, 20);
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead.mutateAsync(notif._id);
    }

    // Smart redirects based on notification metadata
    if (notif.data?.groupId) {
      if (notif.type.includes('rent')) {
        navigate(`/groups/${notif.data.groupId}?tab=rent`);
      } else if (notif.type.includes('budget')) {
        navigate(`/groups/${notif.data.groupId}?tab=budgets`);
      } else if (notif.type.includes('settlement')) {
        navigate(`/groups/${notif.data.groupId}?tab=balances`);
      } else {
        navigate(`/groups/${notif.data.groupId}?tab=expenses`);
      }
    } else {
      navigate('/groups');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'expense_created':
      case 'expense_deleted':
      case 'expense_updated':
        return <Receipt className="w-5 h-5 text-indigo-500" />;
      case 'settlement_recorded':
      case 'settlement_deleted':
        return <ArrowLeftRight className="w-5 h-5 text-emerald-500" />;
      case 'budget_exceeded':
      case 'budget_configured':
        return <CreditCard className="w-5 h-5 text-rose-500" />;
      case 'member_joined':
      case 'member_removed':
      case 'member_promoted':
        return <Users className="w-5 h-5 text-amber-500" />;
      case 'rent_configured':
      case 'rent_updated':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const hasUnread = (notificationsData?.unreadCount || 0) > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brand-500" />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay up to date with roommate expense activity
          </p>
        </div>

        {hasUnread && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!notificationsData || notificationsData.items.length === 0) && (
        <div className="bg-white dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-750" />
          </div>
          <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1">Inbox Clean!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs mx-auto">
            You don't have any notifications right now. Activity reports will appear here when roommate logs occur.
          </p>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && notificationsData && notificationsData.items.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {notificationsData.items.map((notif) => {
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-4 p-4 rounded-2xl border text-sm transition-all cursor-pointer items-start relative group ${
                    notif.isRead
                      ? 'bg-white dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/20'
                      : 'bg-brand-50/10 dark:bg-brand-500/5 border-brand-500/20 shadow-sm hover:bg-brand-50/20 dark:hover:bg-brand-500/10'
                  }`}
                >
                  {/* Category Styled Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.isRead ? 'bg-slate-50 dark:bg-slate-850' : 'bg-brand-50 dark:bg-brand-500/10'
                  }`}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm tracking-tight ${
                        notif.isRead ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-950 dark:text-white'
                      }`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-semibold text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right chevron hover helper */}
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <span>Go</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination Controls */}
          {(() => {
            const totalPages = Math.ceil(notificationsData.total / notificationsData.limit);
            if (totalPages <= 1) return null;
            return (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold disabled:opacity-50 text-slate-650"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-450 font-semibold">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold disabled:opacity-50 text-slate-650"
                >
                  Next
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
