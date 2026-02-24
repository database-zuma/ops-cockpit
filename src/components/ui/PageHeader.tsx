import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)} data-testid="page-header">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground"
          data-testid="breadcrumb"
          aria-label="Breadcrumb"
        >
          {breadcrumb.map((item, index) => (
            <span key={item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-surface-300" aria-hidden="true">
                  /
                </span>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="transition-colors hover:text-accent-primary"
                  data-testid="breadcrumb-link"
                >
                  {item.label}
                </a>
              ) : (
                <span data-testid="breadcrumb-item">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1
        className="relative inline-block text-2xl font-bold tracking-tight text-foreground"
        data-testid="page-title"
      >
        {title}
        <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-gradient-to-r from-accent-primary to-accent-secondary" />
      </h1>
      {subtitle && (
        <p
          className="mt-2 text-sm text-muted-foreground"
          data-testid="page-subtitle"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
