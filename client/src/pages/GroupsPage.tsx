import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus, Search, FolderPlus, ArrowRight, Shield } from 'lucide-react';
import { useMyGroups } from '@/features/groups/hooks';
import CreateGroupModal from '@/features/groups/components/CreateGroupModal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function GroupsPage() {
  const { data: groups, isLoading } = useMyGroups();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  const filteredGroups = groups?.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">My Groups</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your roommates, friends, and shared apartments
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-white dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl skeleton" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-3.5 w-24 skeleton rounded" />
                </div>
              </div>
              <div className="h-4 w-full skeleton rounded mt-6" />
              <div className="h-4 w-2/3 skeleton rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredGroups?.length === 0 && (
        <div className="bg-white dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderPlus className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Groups Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            {search
              ? "We couldn't find any groups matching your search term. Try another query."
              : "Create a group to start sharing and tracking expenses with your room partners."}
          </p>
          {!search && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Create First Group
            </button>
          )}
        </div>
      )}

      {/* Group List */}
      {!isLoading && filteredGroups && filteredGroups.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredGroups.map((group) => {
            const myRole = (group as any).myRole;
            const memberCount = (group as any).memberCount || 1;

            return (
              <motion.div
                key={group._id}
                variants={item}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[180px] relative overflow-hidden"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/25 uppercase text-lg">
                        {group.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="w-3.5 h-3.5" />
                            <span>{memberCount} member{memberCount > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role badge */}
                    {myRole === 'admin' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20 flex items-center gap-0.5">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Member
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {group.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-5">
                  <span className="text-xs text-slate-400">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300">
                    Enter Group
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Decorative hover effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 dark:bg-brand-400/5 rounded-full blur-2xl translate-x-8 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Modal */}
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
