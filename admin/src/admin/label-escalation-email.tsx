import type { LabelNode } from '@interfaces/label';
import { getEscalationEmail } from '@utils/label-attributes';
import { cn } from '@utils/cn';
import { Mail } from 'lucide-react';
import * as React from 'react';

export function LabelEscalationEmail({ label, className }: { label: LabelNode; className?: string }) {
  const escalationEmail = getEscalationEmail(label);
  if (!escalationEmail) return null;

  return (
    <span
      className={cn('flex min-w-0 items-center gap-1 text-xs text-muted-foreground', className)}
      title={`Eskaleringsadress: ${escalationEmail}`}
    >
      <Mail className="size-3.5 shrink-0" />
      <span className="truncate">{escalationEmail}</span>
    </span>
  );
}
