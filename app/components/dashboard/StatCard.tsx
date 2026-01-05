import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    className?: string;
    iconClassName?: string;
}

export function StatCard({ title, value, icon: Icon, subtitle, className, iconClassName }: StatCardProps) {
    return (
        <div className={cn("rounded-xl bg-white p-6 shadow-sm border border-gray-100", className)}>
            <div className="flex items-start justify-between">
                <div>
                    <div className={cn("rounded-lg p-3 w-fit mb-4", iconClassName || "bg-blue-50 text-blue-600")}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
                    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}
