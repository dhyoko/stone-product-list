import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router';
import { SessionProvider } from '../session/SessionProvider';
import { AppRoutes } from './AppRoutes';
import { createQueryClient } from './query-client';
import { theme } from './theme';

export function App(): React.JSX.Element {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
