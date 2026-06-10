import { useState, useEffect } from 'react';
import { Home, FolderOpen } from 'lucide-react';
import { useMyGroups, useGroupDetails } from '@/features/groups/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import RentView from '@/features/rent/components/RentView';
import CustomSelect from '@/components/ui/CustomSelect';

export default function RentPage() {
  const { user } = useAuth();
  const { data: groups, isLoading: isGroupsLoading } = useMyGroups();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return localStorage.getItem('roomsplit_active_group') || '';
  });

  useEffect(() => {
    if (groups && groups.length > 0) {
      if (!selectedGroupId || !groups.some((g) => g._id === selectedGroupId)) {
        setSelectedGroupId(groups[0]._id);
        localStorage.setItem('roomsplit_active_group', groups[0]._id);
      }
    }
  }, [groups, selectedGroupId]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    localStorage.setItem('roomsplit_active_group', groupId);
  };

  const { data: groupData, isLoading: isGroupLoading } = useGroupDetails(selectedGroupId);

  const isLoading = isGroupsLoading || isGroupLoading;

  if (isGroupsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 skeleton rounded" />
        <div className="h-40 skeleton rounded-2xl w-full" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <FolderOpen className="w-12 h-12 text-slate-350 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Groups Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Create or join a room group first under the Groups tab to manage rent and split details.
        </p>
      </div>
    );
  }

  const groupMembers = groupData?.members || [];
  const myMemberRecord = groupMembers.find((m: any) => m.user?._id === user?._id);
  const isAdmin = myMemberRecord?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Home className="w-6 h-6 text-brand-500" />
            Room Rent Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Configure monthly rent limits and view landlord payment timelines
          </p>
        </div>

        {/* Configuration switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Room:
          </label>
          <CustomSelect
            value={selectedGroupId}
            onChange={handleGroupChange}
            options={groups.map((group) => ({
              value: group._id,
              label: group.name,
            }))}
            className="min-w-[180px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 skeleton rounded-2xl w-full" />
          <div className="h-48 skeleton rounded-2xl w-full" />
        </div>
      ) : (
        selectedGroupId && (
          <RentView
            groupId={selectedGroupId}
            members={groupMembers}
            isAdmin={isAdmin}
          />
        )
      )}
    </div>
  );
}
