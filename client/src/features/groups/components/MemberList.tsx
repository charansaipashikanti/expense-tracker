import { useState } from 'react';
import { Shield, UserMinus, UserPlus, ShieldAlert, Award } from 'lucide-react';
import type { GroupMember } from '@/types';
import { useRemoveMember, usePromoteMember } from '../hooks';
import InviteMemberModal from './InviteMemberModal';

interface Props {
  groupId: string;
  members: GroupMember[];
  isAdmin: boolean;
  currentUserId: string;
}

export default function MemberList({ groupId, members, isAdmin, currentUserId }: Props) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const removeMember = useRemoveMember(groupId);
  const promoteMember = usePromoteMember(groupId);

  const handlePromote = async (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to promote ${name} to Group Admin?`)) {
      await promoteMember.mutateAsync(userId);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from this group?`)) {
      await removeMember.mutateAsync(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Group Members</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Members sharing expenses in this group</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-3 py-2 border border-brand-200 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((m) => {
          const isMe = m.user?._id === currentUserId;
          const isMemberAdmin = m.role === 'admin';

          return (
            <div
              key={m._id}
              className="bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl flex items-center justify-between gap-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-white text-sm uppercase">
                  {m.user?.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 dark:text-white block text-sm truncate">
                    {m.user?.name} {isMe && <span className="text-xs font-medium text-slate-400">(You)</span>}
                  </span>
                  <span className="text-xs text-slate-500 truncate block">{m.user?.email}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {isMemberAdmin ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/15 flex items-center gap-0.5">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                    Member
                  </span>
                )}

                {/* Admin options for other members */}
                {isAdmin && !isMe && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isMemberAdmin && (
                      <button
                        onClick={() => handlePromote(m.user?._id, m.user?.name)}
                        disabled={promoteMember.isPending}
                        title="Promote to admin"
                        className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(m.user?._id, m.user?.name)}
                      disabled={removeMember.isPending}
                      title="Remove member"
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        groupId={groupId}
      />
    </div>
  );
}
