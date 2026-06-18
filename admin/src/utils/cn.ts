import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn/ui class-name helper. Used only by the shadcn PoC components
 * under `src/components/ui/*`. The rest of the app uses `cx` from
 * `@sk-web-gui/react`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
