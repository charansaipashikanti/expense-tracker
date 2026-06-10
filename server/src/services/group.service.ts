import mongoose from 'mongoose';
import Group, { IGroup } from '../models/Group';
import GroupMember from '../models/GroupMember';
import Invitation from '../models/Invitation';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { generateToken } from '../utils/helpers';

class GroupService {
  /**
   * Create a new group and add the creator as admin
   */
  async createGroup(data: Partial<IGroup>, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const group = await Group.create(
        [{ ...data, createdBy: userId }],
        { session }
      );

      // Add creator as admin member
      await GroupMember.create(
        [{
          groupId: group[0]._id,
          userId,
          role: 'admin',
          addedBy: userId,
        }],
        { session }
      );

      // Activity log
      await ActivityLog.create(
        [{
          groupId: group[0]._id,
          userId,
          action: 'group_created',
          details: `Created group "${group[0].name}"`,
          entityType: 'group',
          entityId: group[0]._id,
        }],
        { session }
      );

      await session.commitTransaction();
      return group[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string): Promise<any[]> {
    const memberships = await GroupMember.find({
      userId,
      isActive: true,
    }).select('groupId role');

    const groupIds = memberships.map((m) => m.groupId);

    const groups = await Group.find({
      _id: { $in: groupIds },
      isActive: true,
    }).sort({ updatedAt: -1 });

    // Attach member counts and roles
    const result = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await GroupMember.countDocuments({
          groupId: group._id,
          isActive: true,
        });
        const membership = memberships.find(
          (m) => m.groupId.toString() === group._id.toString()
        );
        return {
          ...group.toJSON(),
          memberCount,
          myRole: membership?.role,
        };
      })
    );

    return result;
  }

  /**
   * Get group by ID with members
   */
  async getGroupById(groupId: string): Promise<any> {
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      throw ApiError.notFound('Group not found');
    }

    const members = await GroupMember.find({
      groupId,
      isActive: true,
    }).populate('userId', 'name email avatar');

    return {
      ...group.toJSON(),
      members: members.map((m) => ({
        _id: m._id,
        userId: (m.userId as any)._id,
        user: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      memberCount: members.length,
    };
  }

  /**
   * Update group settings
   */
  async updateGroup(groupId: string, data: Partial<IGroup>, userId: string) {
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!group) throw ApiError.notFound('Group not found');

    await ActivityLog.create({
      groupId,
      userId,
      action: 'group_updated',
      details: `Updated group settings`,
      entityType: 'group',
      entityId: group._id,
    });

    return group;
  }

  /**
   * Delete (soft) a group
   */
  async deleteGroup(groupId: string) {
    const group = await Group.findByIdAndUpdate(
      groupId,
      { isActive: false },
      { new: true }
    );
    if (!group) throw ApiError.notFound('Group not found');
    return group;
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, email: string, addedByUserId: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.notFound('User not found. They need to sign up first.');
    }

    const existing = await GroupMember.findOne({
      groupId,
      userId: user._id,
    });

    if (existing) {
      if (existing.isActive) {
        throw ApiError.conflict('User is already a member of this group');
      }
      // Reactivate
      existing.isActive = true;
      existing.leftAt = undefined;
      await existing.save();
    } else {
      await GroupMember.create({
        groupId,
        userId: user._id,
        role: 'member',
        addedBy: addedByUserId,
      });
    }

    await ActivityLog.create({
      groupId,
      userId: addedByUserId,
      action: 'member_added',
      details: `Added ${user.name} to group`,
      entityType: 'member',
      entityId: user._id,
    });

    return { userId: user._id, name: user.name, email: user.email };
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string, removedByUserId: string) {
    const member = await GroupMember.findOne({ groupId, userId, isActive: true });
    if (!member) throw ApiError.notFound('Member not found in this group');

    if (member.role === 'admin') {
      // Check if there are other admins
      const adminCount = await GroupMember.countDocuments({
        groupId,
        role: 'admin',
        isActive: true,
      });
      if (adminCount <= 1) {
        throw ApiError.badRequest('Cannot remove the last admin. Promote another member first.');
      }
    }

    member.isActive = false;
    member.leftAt = new Date();
    await member.save();

    const user = await User.findById(userId);

    await ActivityLog.create({
      groupId,
      userId: removedByUserId,
      action: 'member_removed',
      details: `Removed ${user?.name || 'a member'} from group`,
      entityType: 'member',
      entityId: new mongoose.Types.ObjectId(userId),
    });
  }

  /**
   * Promote member to admin
   */
  async promoteMember(groupId: string, userId: string, promotedByUserId: string) {
    const member = await GroupMember.findOne({ groupId, userId, isActive: true });
    if (!member) throw ApiError.notFound('Member not found');

    member.role = 'admin';
    await member.save();

    const user = await User.findById(userId);

    await ActivityLog.create({
      groupId,
      userId: promotedByUserId,
      action: 'member_promoted',
      details: `Promoted ${user?.name || 'a member'} to admin`,
      entityType: 'member',
      entityId: new mongoose.Types.ObjectId(userId),
    });
  }

  /**
   * Create invitation
   */
  async createInvitation(groupId: string, email: string, invitedByUserId: string) {
    // Check if already invited
    const existing = await Invitation.findOne({
      groupId,
      email,
      status: 'pending',
    });
    if (existing) {
      throw ApiError.conflict('Invitation already sent to this email');
    }

    // Check if already a member
    const user = await User.findOne({ email });
    if (user) {
      const isMember = await GroupMember.findOne({
        groupId,
        userId: user._id,
        isActive: true,
      });
      if (isMember) {
        throw ApiError.conflict('This user is already a member of the group');
      }
    }

    const token = generateToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await Invitation.create({
      groupId,
      email,
      token,
      expiresAt,
      invitedBy: invitedByUserId,
    });

    return invitation;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userId: string) {
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
    }).populate('groupId');

    if (!invitation) {
      throw ApiError.notFound('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw ApiError.badRequest('This invitation has expired');
    }

    // Add as member
    const existing = await GroupMember.findOne({
      groupId: invitation.groupId,
      userId,
    });

    if (existing) {
      if (existing.isActive) {
        throw ApiError.conflict('You are already a member of this group');
      }
      existing.isActive = true;
      existing.leftAt = undefined;
      await existing.save();
    } else {
      await GroupMember.create({
        groupId: invitation.groupId,
        userId,
        role: 'member',
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    return invitation;
  }

  /**
   * Get active members of a group
   */
  async getGroupMembers(groupId: string) {
    return GroupMember.find({
      groupId,
      isActive: true,
    }).populate('userId', 'name email avatar');
  }
}

export const groupService = new GroupService();
