import React, { useState } from "react";
import { Settings, Users, BarChart3, Archive, Activity } from "lucide-react";
import { UsageStats } from "./space/UsageStats";
import { MemberManagement } from "./space/MemberManagement";
import { SpaceSettings } from "./space/SpaceSettings";
import { BackupManagement } from "./space/BackupManagement";
import { ActivityLogs } from "./space/ActivityLogs";

type SpaceTab = "usage" | "members" | "settings" | "backups" | "activity";

export const SpaceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SpaceTab>("usage");

  const tabs = [
    { id: "usage" as SpaceTab, label: "Usage & Quotas", icon: BarChart3 },
    { id: "members" as SpaceTab, label: "Members", icon: Users },
    { id: "settings" as SpaceTab, label: "Settings", icon: Settings },
    { id: "backups" as SpaceTab, label: "Backups", icon: Archive },
    { id: "activity" as SpaceTab, label: "Activity", icon: Activity },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "usage":
        return <UsageStats />;
      case "members":
        return <MemberManagement />;
      case "settings":
        return <SpaceSettings />;
      case "backups":
        return <BackupManagement />;
      case "activity":
        return <ActivityLogs />;
      default:
        return <UsageStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Space Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your workspace settings, members, and usage
          </p>
        </div>

        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-6">{renderContent()}</div>
    </div>
  );
};
