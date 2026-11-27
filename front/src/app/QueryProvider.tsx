import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { useSession } from '../session/session-context';
import { createQueryClient } from './query-client';

export function QueryProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const { endSession } = useSession();
  const [queryClient] = useState(() => createQueryClient({ onUnauthorized: endSession }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
