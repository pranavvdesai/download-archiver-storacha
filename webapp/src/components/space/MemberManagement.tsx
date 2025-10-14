import React, { useState } from "react";
import {
  UserPlus,
  Mail,
  MoreVertical,
  Crown,
  Shield,
  User,
  Eye,
} from "lucide-react";
import { SpaceMember, SpaceRole } from "../../types";

// Mock data - replace with actual API calls
const mockMembers: SpaceMember[] = [
  {
    id: "1",
    email: "alice@example.com",
    name: "Alice Johnson",
    avatar: "",
    role: "owner",
    joinedAt: new Date("2024-01-15"),
    lastActive: new Date("2024-02-18"),
  },
  {
    id: "2",
    email: "bob@example.com",
    name: "Bob Smith",
    avatar: "",
    role: "admin",
    joinedAt: new Date("2024-01-20"),
    lastActive: new Date("2024-02-17"),
  },
  {
    id: "3",
    email: "carol@example.com",
    name: "Carol Davis",
    avatar: "",
    role: "member",
    joinedAt: new Date("2024-02-01"),
    lastActive: new Date("2024-02-16"),
  },
];

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleColors = {
  owner: "text-yellow-600 bg-yellow-100",
  admin: "text-purple-600 bg-purple-100",
  member: "text-blue-600 bg-blue-100",
  viewer: "text-gray-600 bg-gray-100",
};

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: SpaceRole) => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SpaceRole>("member");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim(), role);
      setEmail("");
      setRole("member");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Invite Member
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="member@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as SpaceRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="viewer">Viewer - Can view files</option>
              <option value="member">
                Member - Can upload and manage files
              </option>
              <option value="admin">
                Admin - Can manage members and settings
              </option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MemberManagement: React.FC = () => {
  const [members] = useState<SpaceMember[]>(mockMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleInvite = (email: string, role: SpaceRole) => {
    console.log("Inviting:", email, "as", role);
    // Implement invite logic
  };

  const handleRoleChange = (memberId: string, newRole: SpaceRole) => {
    console.log("Changing role for member:", memberId, "to", newRole);
    // Implement role change logic
  };

  const handleRemoveMember = (memberId: string) => {
    console.log("Removing member:", memberId);
    // Implement remove member logic
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
          <p className="text-gray-600">
            Manage who has access to this workspace
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">
            {members.length} Members
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role];
            return (
              <div
                key={member.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {member.name || member.email}
                      </h4>
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          roleColors[member.role]
                        }`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-xs text-gray-500">
                      Joined {member.joinedAt.toLocaleDateString()} • Last
                      active {member.lastActive.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {member.role !== "owner" && (
                    <div className="relative">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
      />
    </div>
  );
};
