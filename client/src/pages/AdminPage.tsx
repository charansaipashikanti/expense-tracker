import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Layers,
  Receipt,
  Activity,
  UserCheck,
  UserX,
  ToggleLeft,
  ToggleRight,
  Trash2,
  FolderMinus,
  Database,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import {
  useAdminUsers,
  useToggleUserStatus,
  useAdminGroups,
  useDeactivateGroup,
  useSystemAnalytics
} from '@/features/admin/hooks';
import { formatCurrency } from '@/lib/utils';

type TabType = 'users' | 'groups';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [usersPage, setUsersPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);

  // Queries
  const { data: analytics, isLoading: isAnalyticsLoading } = useSystemAnalytics();
  const { data: usersData, isLoading: isUsersLoading } = useAdminUsers(usersPage, 10);
  const { data: groupsData, isLoading: isGroupsLoading } = useAdminGroups(groupsPage, 10);

  // Mutations
  const toggleUser = useToggleUserStatus();
  const deactivateGroup = useDeactivateGroup();

  const handleToggleUser = async (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to toggle access status for "${name}"?`)) {
      await toggleUser.mutateAsync(userId);
    }
  };

  const handleDeactivateGroup = async (groupId: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate the group "${name}"? Members will no longer be able to access it.`)) {
      await deactivateGroup.mutateAsync(groupId);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-brand-600" />
          Super Admin Console
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor system metrics, toggle access, and manage room settings
        </p>
      </div>

      {/* System Metrics aggregate */}
      {isAnalyticsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {analytics.totalUsers}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5 text-emerald-650 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Groups</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {analytics.totalGroups}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-violet-650 dark:text-violet-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expenses Logs</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {analytics.totalExpenses}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-amber-650 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Roommates</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {analytics.activeUsersThisMonth}
                </span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 font-bold text-sm transition-all relative ${
            activeTab === 'users' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Manage Users
          {activeTab === 'users' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`py-3 font-bold text-sm transition-all relative ${
            activeTab === 'groups' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Manage Groups
          {activeTab === 'groups' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
          )}
        </button>
      </div>

      {/* Lists */}
      <div>
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase mb-4 tracking-wider flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-slate-400" />
              System User Accounts
            </h3>

            {isUsersLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 skeleton rounded-xl" />
                ))}
              </div>
            ) : (
              usersData && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="py-2.5">User</th>
                          <th className="py-2.5">Email</th>
                          <th className="py-2.5">Role</th>
                          <th className="py-2.5">Created Date</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                        {usersData.items.map((user) => (
                          <tr key={user._id} className="text-slate-700 dark:text-slate-300">
                            <td className="py-3 font-bold text-slate-950 dark:text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-slate-850 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-[10px] uppercase">
                                {user.name.slice(0, 2)}
                              </div>
                              <span>{user.name}</span>
                            </td>
                            <td className="py-3 font-semibold">{user.email}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                user.role === 'superadmin'
                                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/50'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {user.role === 'superadmin' ? 'Super Admin' : 'User'}
                              </span>
                            </td>
                            <td className="py-3">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                user.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {user.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleToggleUser(user._id, user.name)}
                                  disabled={toggleUser.isPending}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ml-auto ${
                                    user.isActive
                                      ? 'border-rose-200/50 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-500/10'
                                      : 'border-emerald-200/50 hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-500/10'
                                  }`}
                                >
                                  {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  <span>{user.isActive ? 'Disable' : 'Enable'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {usersData.total > 10 && (
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-bold text-slate-400">
                      <button
                        onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                        disabled={usersPage === 1}
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span>Page {usersPage}</span>
                      <button
                        onClick={() => setUsersPage(p => p + 1)}
                        disabled={usersPage * 10 >= usersData.total}
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase mb-4 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4.5 h-4.5 text-slate-400" />
              System Rooms & Groups
            </h3>

            {isGroupsLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 skeleton rounded-xl" />
                ))}
              </div>
            ) : (
              groupsData && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="py-2.5">Group Name</th>
                          <th className="py-2.5">Members</th>
                          <th className="py-2.5">Owner</th>
                          <th className="py-2.5">Created Date</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                        {groupsData.items.map((group) => (
                          <tr key={group._id} className="text-slate-700 dark:text-slate-350">
                            <td className="py-3 font-bold text-slate-950 dark:text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg gradient-bg text-white flex items-center justify-center font-bold text-[10px] uppercase">
                                {group.name.slice(0, 2)}
                              </div>
                              <span>{group.name}</span>
                            </td>
                            <td className="py-3 font-bold text-slate-950 dark:text-white">{group.memberCount} members</td>
                            <td className="py-3 font-semibold">
                              {(group.createdBy as any)?.name || 'Unknown'}
                            </td>
                            <td className="py-3">
                              {new Date(group.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                (group as any).isActive !== false
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-50 dark:bg-slate-850 text-slate-400 border border-slate-200/50'
                              }`}>
                                {(group as any).isActive !== false ? 'Active' : 'Deactivated'}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {(group as any).isActive !== false && (
                                <button
                                  onClick={() => handleDeactivateGroup(group._id, group.name)}
                                  disabled={deactivateGroup.isPending}
                                  className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-rose-250/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-1 ml-auto"
                                >
                                  <FolderMinus className="w-3.5 h-3.5" />
                                  <span>Deactivate</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {groupsData.total > 10 && (
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-bold text-slate-400">
                      <button
                        onClick={() => setGroupsPage(p => Math.max(1, p - 1))}
                        disabled={groupsPage === 1}
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span>Page {groupsPage}</span>
                      <button
                        onClick={() => setGroupsPage(p => p + 1)}
                        disabled={groupsPage * 10 >= groupsData.total}
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
