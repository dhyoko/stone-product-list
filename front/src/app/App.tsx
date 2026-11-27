import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router';
import { SessionProvider } from '../session/SessionProvider';
import { AppRoutes } from './AppRoutes';
import { QueryProvider } from './QueryProvider';
import { theme } from './theme';

export function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>
        <QueryProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
