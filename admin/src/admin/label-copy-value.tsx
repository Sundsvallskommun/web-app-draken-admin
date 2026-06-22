import { Button } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@utils/cn';
import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface LabelCopyValueProps {
  value?: string;
  className?: string;
  iconOnly?: boolean;
}

export function LabelCopyValue({ value, className, iconOnly = false }: LabelCopyValueProps) {
  const [copied, setCopied] = React.useState(false);
  const resetTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  if (!value) return null;

  const copyValue = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Resursnamn kopierades.');

      if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Kunde inte kopiera resursnamn.');
    }
  };

  const Icon = copied ? Check : Copy;
  const label = `Kopiera resursnamn ${value}`;

  const button = (
    <Button
      type="button"
      variant={iconOnly ? 'ghost' : 'outline'}
      size={iconOnly ? 'icon' : 'sm'}
      aria-label={label}
      title={label}
      onClick={copyValue}
      className={cn(
        iconOnly
          ? 'size-7 shrink-0 text-muted-foreground hover:text-foreground'
          : 'h-7 max-w-full justify-start gap-1.5 border-dashed bg-background px-2 font-mono text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground',
        copied && 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
        className
      )}
    >
      {!iconOnly && <span className="truncate">{value}</span>}
      <Icon className="size-3.5" />
    </Button>
  );

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{copied ? 'Kopierat' : 'Kopiera resursnamn'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
