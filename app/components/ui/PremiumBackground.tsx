import { cn } from "~/lib/utils";

export function PremiumBackground({ className }: { className?: string }) {
    return (
        <div className={cn("fixed inset-0 z-[-1] overflow-hidden pointer-events-none", className)}>
            <div className="absolute top-0 left-0 w-full h-full bg-slate-50" />
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px] opacity-50 animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] opacity-50" />
            <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-emerald-200/20 rounded-full blur-[80px] opacity-30" />
        </div>
    );
}
