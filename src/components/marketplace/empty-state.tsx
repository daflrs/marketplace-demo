import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-pop-in flex flex-col items-center rounded-xl bg-white px-6 py-14 text-center ring-1 ring-gray-200/70">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children && <div className="mt-1 max-w-sm text-sm text-gray-600">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
