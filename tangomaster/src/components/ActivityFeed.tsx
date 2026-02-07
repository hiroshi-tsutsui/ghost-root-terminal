import React from 'react';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export const ActivityFeed: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-700">Friend Activity</h3>
      {activities.map(activity => (
        <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {activity.userName[0]}
          </div>
          <div>
            <p className="text-sm">
              <span className="font-semibold">{activity.userName}</span> {activity.action}
            </p>
            <span className="text-xs text-gray-400">{activity.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
