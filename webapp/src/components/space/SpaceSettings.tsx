import React, { useState } from "react";
import { Save, Globe, Lock, Users } from "lucide-react";
import { SpaceSettings as SpaceSettingsType } from "../../types";

// Mock data - replace with actual API calls
const mockSettings: SpaceSettingsType = {
  name: "My Workspace",
  description: "A collaborative workspace for our team projects",
  visibility: "private",
  allowMemberInvites: true,
  requireApproval: false,
  defaultFileVisibility: "private",
};

export const SpaceSettings: React.FC = () => {
  const [settings, setSettings] = useState<SpaceSettingsType>(mockSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Saving settings:", settings);
    setIsSaving(false);
  };

  const updateSetting = <K extends keyof SpaceSettingsType>(
    key: K,
    value: SpaceSettingsType[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Workspace Settings
          </h2>
          <p className="text-gray-600">
            Configure your workspace preferences and permissions
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSetting("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={settings.description || ""}
                onChange={(e) => updateSetting("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe your workspace..."
              />
            </div>
          </div>
        </div>

        {/* Visibility & Access */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Visibility & Access
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Visibility
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: "private",
                    label: "Private",
                    desc: "Only invited members can access",
                    icon: Lock,
                  },
                  {
                    value: "team",
                    label: "Team",
                    desc: "Members of your organization can request access",
                    icon: Users,
                  },
                  {
                    value: "public",
                    label: "Public",
                    desc: "Anyone can view public files",
                    icon: Globe,
                  },
                ].map(({ value, label, desc, icon: Icon }) => (
                  <label
                    key={value}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={settings.visibility === value}
                      onChange={(e) =>
                        updateSetting("visibility", e.target.value as any)
                      }
                      className="mt-1"
                    />
                    <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{label}</div>
                      <div className="text-sm text-gray-600">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Member Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Member Permissions
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  Allow member invites
                </div>
                <div className="text-sm text-gray-600">
                  Let members invite others to the workspace
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowMemberInvites}
                onChange={(e) =>
                  updateSetting("allowMemberInvites", e.target.checked)
                }
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  Require approval for new members
                </div>
                <div className="text-sm text-gray-600">
                  New members need admin approval before joining
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) =>
                  updateSetting("requireApproval", e.target.checked)
                }
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* File Defaults */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            File Defaults
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default file visibility
            </label>
            <select
              value={settings.defaultFileVisibility}
              onChange={(e) =>
                updateSetting("defaultFileVisibility", e.target.value as any)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="private">Private - Only workspace members</option>
              <option value="public">Public - Anyone with the link</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
