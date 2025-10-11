import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  FileText,
  Users,
  Settings,
  Archive,
} from "lucide-react";
import { ActivityLogEntry } from "../../types";
import { formatDate } from "../../utils/fileUtils";

// Mock data - replace with actual API calls
const mockActivities: ActivityLogEntry[] = [
  {
    id: "1",
    userId: "1",
    userName: "Alice Johnson",
    action: "uploaded",
    target: "project-files.zip",
    details: "2.4 MB",
    timestamp: new Date("2024-02-18T14:30:00"),
    type: "file",
  },
  {
    id: "2",
    userId: "2",
    userName: "Bob Smith",
    action: "invited",
    target: "carol@example.com",
    details: "as member",
    timestamp: new Date("2024-02-18T12:15:00"),
    type: "member",
  },
  {
    id: "3",
    userId: "1",
    userName: "Alice Johnson",
    action: "updated",
    target: "workspace settings",
    details: "changed visibility to private",
    timestamp: new Date("2024-02-18T10:45:00"),
    type: "settings",
  },
  {
    id: "4",
    userId: "3",
    userName: "Carol Davis",
    action: "downloaded",
    target: "presentation.pdf",
    details: "1.2 MB",
    timestamp: new Date("2024-02-17T16:20:00"),
    type: "file",
  },
  {
    id: "5",
    userId: "1",
    userName: "Alice Johnson",
    action: "created",
    target: "manual backup",
    details: "Before major update",
    timestamp: new Date("2024-02-17T09:30:00"),
    type: "backup",
  },
];

const typeIcons = {
  file: FileText,
  member: Users,
  settings: Settings,
  backup: Archive,
};

const typeColors = {
  file: "text-blue-600 bg-blue-100",
  member: "text-green-600 bg-green-100",
  settings: "text-purple-600 bg-purple-100",
  backup: "text-orange-600 bg-orange-100",
};

export const ActivityLogs: React.FC = () => {
  const [activities] = useState<ActivityLogEntry[]>(mockActivities);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      searchQuery === "" ||
      activity.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.target.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "all" || activity.type === selectedType;

    const now = new Date();
    const activityDate = activity.timestamp;
    let matchesDate = true;

    if (dateRange === "1day") {
      matchesDate =
        now.getTime() - activityDate.getTime() <= 24 * 60 * 60 * 1000;
    } else if (dateRange === "7days") {
      matchesDate =
        now.getTime() - activityDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
    } else if (dateRange === "30days") {
      matchesDate =
        now.getTime() - activityDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const handleExport = () => {
    console.log("Exporting activity logs...");
    // Implement export logic
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Activity Logs</h2>
          <p className="text-gray-600">
            Track all actions and changes in your workspace
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="file">Files</option>
              <option value="member">Members</option>
              <option value="settings">Settings</option>
              <option value="backup">Backups</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="1day">Last 24 hours</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">
            {filteredActivities.length} Activities
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No activities found matching your filters</p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const TypeIcon = typeIcons[activity.type];
              return (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-2 rounded-lg ${typeColors[activity.type]}`}
                    >
                      <TypeIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {activity.userName}
                        </span>
                        <span className="text-gray-600">{activity.action}</span>
                        <span className="font-medium text-gray-900">
                          {activity.target}
                        </span>
                        {activity.details && (
                          <span className="text-gray-500">
                            ({activity.details})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.timestamp)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            typeColors[activity.type]
                          }`}
                        >
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
