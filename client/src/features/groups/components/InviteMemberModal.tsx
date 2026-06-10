import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useAddMember, useCreateInvitation } from '../hooks';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormInput = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export default function InviteMemberModal({ isOpen, onClose, groupId }: Props) {
  const addMember = useAddMember(groupId);
  const createInvite = useCreateInvitation(groupId);
  const [showInviteOption, setShowInviteOption] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
  });

  const onSubmit = async (data: FormInput) => {
    try {
      setSuccessMsg('');
      setShowInviteOption(false);
      setInvitedEmail(data.email);

      // Attempt to add directly
      await addMember.mutateAsync(data.email);
      setSuccessMsg(`Successfully added ${data.email} to this group!`);
      reset();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // User not found in database — show invite button
        setShowInviteOption(true);
      }
    }
  };

  const handleSendInvite = async () => {
    try {
      await createInvite.mutateAsync(invitedEmail);
      setSuccessMsg(`Invitation email sent to ${invitedEmail}!`);
      setShowInviteOption(false);
      reset();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    } catch {
      // Handled by hook
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-6 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Group Member</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Invite friends via email</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Invite Option (Fallback if user does not exist) */}
            {showInviteOption ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>{invitedEmail}</strong> is not registered in RoomSplit yet.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    You can send an invitation email so they can create an account and join automatically.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteOption(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    disabled={createInvite.isPending}
                    className="flex-1 px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {createInvite.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Invite
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Add Form */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="friend@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || addMember.isPending}
                    className="px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {addMember.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add Member
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
