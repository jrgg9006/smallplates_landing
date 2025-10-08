import { GuestStatistics } from "@/lib/types/guest";

interface GuestStatisticsProps {
  stats: GuestStatistics;
}

export function GuestStatisticsComponent({ stats }: GuestStatisticsProps) {
  const statItems = [
    {
      label: "Guests",
      value: stats.totalGuests,
    },
    {
      label: "Invites Sent", 
      value: stats.invitesSent,
    },
    {
      label: "Recipes Received",
      value: stats.recipesReceived,
    },
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6 h-full flex items-center">
      <div className="grid grid-cols-3 divide-x divide-gray-200 w-full">
        {statItems.map((stat, index) => (
          <div key={index} className="text-center px-4">
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}