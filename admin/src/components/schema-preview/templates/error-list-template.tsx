'use client';

import { ErrorListProps } from '@rjsf/utils';

// Empty error list template - we don't want to show a big error list at the top
// Individual field errors are shown inline via rawErrors in each widget
export const ErrorListTemplate: React.FC<ErrorListProps> = () => {
  return null;
};

export default ErrorListTemplate;
