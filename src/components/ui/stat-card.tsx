import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle: string;
}

export function StatCard({ title, value, icon: Icon, color = "bg-primary", subtitle }: StatCardProps) {
  return (
    <div className="rounded-2xl border glass-card p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1 text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} rounded-lg p-2.5 text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

