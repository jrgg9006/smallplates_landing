import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestStatistics } from "@/lib/types/guest";

interface GuestStatisticsProps {
  stats: GuestStatistics;
}

export function GuestStatisticsComponent({ stats }: GuestStatisticsProps) {
  const statCards = [
    {
      title: "Total Guests",
      value: stats.totalGuests,
    },
    {
      title: "Invites Sent",
      value: stats.invitesSent,
    },
    {
      title: "Recipes Received",
      value: stats.recipesReceived,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}