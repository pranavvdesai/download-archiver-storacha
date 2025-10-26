import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, Mail, Crown, Settings as SettingsIcon, Eye } from 'lucide-react';
import { spaceMemberService, eventService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface SpaceMember {
  id: string;
  user_email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  last_active_at: string;
  permissions: any;
}

interface Permission {
  id: string;
  label: string;
  description: string;
}

const PERMISSIONS: Permission[] = [
  { id: 'upload', label: 'Upload Files', description: 'Can upload new files to the space' },
  { id: 'delete', label: 'Delete Files', description: 'Can delete files from the space' },
  { id: 'share', label: 'Share Files', description: 'Can create share links for files' },
  { id: 'edit_metadata', label: 'Edit Metadata', description: 'Can edit file names and tags' },
  { id: 'manage_members', label: 'Manage Members', description: 'Can invite and remove members' },
  { id: 'view_analytics', label: 'View Analytics', description: 'Can view file metrics and analytics' },
];

const ROLE_DESCRIPTIONS = {
  owner: 'Full access to all features including space deletion',
  admin: 'Can manage members and all files',
  member: 'Can upload, view, and manage their own files',
  viewer: 'Can only view files (read-only access)',
};

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200',
};

interface SpaceCollaborationProps {
  spaceId: string;
  spaceName: string;
}

export const SpaceCollaboration: React.FC<SpaceCollaborationProps> = ({ spaceId, spaceName }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SpaceMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
    loadCurrentUserRole();
  }, [spaceId]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const spaceMembers = await spaceMemberService.getSpaceMembers(spaceId);
      setMembers(spaceMembers as any);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUserRole = async () => {
    if (!user?.email) return;
    try {
      const role = await spaceMemberService.getMemberRole(spaceId, user.email);
      setCurrentUserRole(role);
    } catch (error) {
      console.error('Failed to load user role:', error);
    }
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleInviteMember = async () => {
    if (!user?.email || !inviteEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!canManageMembers) {
      toast.error('You do not have permission to invite members');
      return;
    }

    setIsLoading(true);
    try {
      const existingMember = members.find(m => m.user_email === inviteEmail.trim());
      if (existingMember) {
        toast.error('This user is already a member of this space');
        return;
      }

      await spaceMemberService.addMember({
        space_id: spaceId,
        user_email: inviteEmail.trim(),
        role: inviteRole,
        permissions: {},
      });

      await eventService.logEvent({
        event_type: 'space.member_added',
        user_email: user.email,
        space_id: spaceId,
        payload: {
          invited_email: inviteEmail.trim(),
          role: inviteRole,
        },
      });

      toast.success(`${inviteEmail} has been invited as ${inviteRole}`);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteModal(false);
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      toast.error(`Failed to invite member: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!canManageMembers) {
      toast.error('You do not have permission to remove members');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${memberEmail} from this space?`)) {
      return;
    }

    try {
      await spaceMemberService.removeMember(spaceId, memberEmail);

      if (user?.email) {
        await eventService.logEvent({
          event_type: 'space.member_removed',
          user_email: user.email,
          space_id: spaceId,
          payload: {
            removed_email: memberEmail,
          },
        });
      }

      toast.success(`${memberEmail} has been removed from the space`);
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error(`Failed to remove member: ${error.message}`);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!canManageMembers) {
      toast.error('You do not have permission to change roles');
      return;
    }

    try {
      await spaceMemberService.updateMember(memberId, { role: newRole as any });

      if (user?.email) {
        await eventService.logEvent({
          event_type: 'space.role_changed',
          user_email: user.email,
          space_id: spaceId,
          payload: {
            member_id: memberId,
            new_role: newRole,
          },
        });
      }

      toast.success('Role updated successfully');
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    }
  };

  const handleUpdatePermissions = async (permissions: any) => {
    if (!selectedMember || !canManageMembers) return;

    try {
      await spaceMemberService.updateMember(selectedMember.id, { permissions });

      toast.success('Permissions updated successfully');
      setShowPermissionsModal(false);
      setSelectedMember(null);
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      toast.error(`Failed to update permissions: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'member':
        return <Users className="w-4 h-4" />;
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Team Members
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage access and permissions for {spaceName}
          </p>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No members yet. Invite someone to collaborate!</p>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{member.user_email}</h3>
                      {member.user_email === user?.email && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span>Joined {formatDate(member.joined_at)}</span>
                      {member.last_active_at && (
                        <span>Last active {formatDate(member.last_active_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {canManageMembers && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className={`px-3 py-1 border rounded-lg text-sm font-medium ${ROLE_COLORS[member.role]}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 border rounded-lg text-sm font-medium ${ROLE_COLORS[member.role]}`}
                      >
                        {getRoleIcon(member.role)}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canManageMembers && member.role !== 'owner' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowPermissionsModal(true);
                          }}
                          className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-600"
                          title="Manage permissions"
                        >
                          <SettingsIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.user_email)}
                          className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 ml-14 text-xs text-gray-500">
                {ROLE_DESCRIPTIONS[member.role]}
              </div>
            </div>
          ))
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Invite Team Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="admin">Admin - {ROLE_DESCRIPTIONS.admin}</option>
                  <option value="member">Member - {ROLE_DESCRIPTIONS.member}</option>
                  <option value="viewer">Viewer - {ROLE_DESCRIPTIONS.viewer}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleInviteMember}
                disabled={isLoading || !inviteEmail.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('member');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Manage Permissions for {selectedMember.user_email}
            </h3>

            <div className="space-y-3 mb-6">
              {PERMISSIONS.map((permission) => {
                const isChecked = selectedMember.permissions?.[permission.id] === true;
                return (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setSelectedMember({
                          ...selectedMember,
                          permissions: {
                            ...selectedMember.permissions,
                            [permission.id]: e.target.checked,
                          },
                        });
                      }}
                      className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{permission.label}</div>
                      <div className="text-sm text-gray-500">{permission.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleUpdatePermissions(selectedMember.permissions)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Save Permissions
              </button>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedMember(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
