import { LabelCopyValue } from '@admin/label-copy-value';
import { Button } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip';
import type { LabelNode } from '@interfaces/label';
import { cn } from '@utils/cn';
import { Settings } from 'lucide-react';
import * as React from 'react';

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

export function LabelActions({
  label,
  labelValue,
  className,
  onSettings,
}: {
  label: LabelNode;
  labelValue: string;
  className?: string;
  onSettings?: (label: LabelNode, labelValue: string) => void;
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <LabelCopyValue value={label.resourceName} iconOnly />
      {onSettings && (
        <TooltipProvider delayDuration={250}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label={`Öppna inställningar för ${labelName(label)}`}
                onClick={() => onSettings(label, labelValue)}
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inställningar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
