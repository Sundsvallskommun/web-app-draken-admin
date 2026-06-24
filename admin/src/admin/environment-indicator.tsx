import { Badge } from '@components/ui/badge';
import { cn } from '@utils/cn';
import type { AdminEnvironmentState } from '@utils/admin-environment';
import { FlaskConical, Loader2, ShieldAlert, TriangleAlert } from 'lucide-react';

interface EnvironmentIndicatorProps {
  environment: AdminEnvironmentState;
  className?: string;
}

export function EnvironmentIndicator({ environment, className }: EnvironmentIndicatorProps) {
  const Icon =
    environment.status === 'checking' ? Loader2
    : environment.kind === 'production' ? ShieldAlert
    : environment.kind === 'test' ? FlaskConical
    : TriangleAlert;

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-8 shrink-0 gap-1.5 px-2.5 py-1 text-xs uppercase tracking-normal',
        environment.badgeClassName,
        className
      )}
      title={environment.description}
      aria-label={environment.description}
    >
      <Icon className={cn('size-3.5', environment.status === 'checking' && 'animate-spin')} aria-hidden="true" />
      <span className="whitespace-nowrap">{environment.label}</span>
    </Badge>
  );
}
