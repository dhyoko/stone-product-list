import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMutation } from '@tanstack/react-query';
import { type SubmitEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { isApiError } from '../api/api-error';
import { logIn } from '../api/auth-api';
import { AppFooter } from '../layout/AppFooter';
import { PageLayout } from '../layout/PageLayout';
import { useSession } from '../session/session-context';
import {
  describeLoginError,
  hasErrors,
  type LoginFieldErrors,
  type LoginValues,
  retryWaitSeconds,
  validateLogin,
} from './login-form';
import { DemoAccount } from './DemoAccount';
import { PasswordField } from './PasswordField';

const DEFAULT_REDIRECT = '/products';

const redirectStateSchema = z.object({ from: z.string().startsWith('/') });

export function LoginPage(): React.JSX.Element {
  const { session, startSession } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const redirectTo = redirectStateSchema.safeParse(location.state).data?.from ?? DEFAULT_REDIRECT;

  const login = useMutation({
    mutationFn: logIn,
    onSuccess: (response) => {
      startSession(response);
      void navigate(redirectTo, { replace: true });
    },
    onError: (error) => {
      if (isApiError(error) && error.code === 'RATE_LIMIT_EXCEEDED') {
        setLockedUntil(Date.now() + retryWaitSeconds(error) * 1000);
      }
    },
  });

  useEffect(() => {
    if (lockedUntil === null) {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setLockedUntil(null);
    }, lockedUntil - Date.now());
    return () => {
      window.clearTimeout(timeout);
    };
  }, [lockedUntil]);

  if (session !== null) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const errors = validateLogin(values);
    setFieldErrors(errors);
    if (!hasErrors(errors)) {
      login.mutate({ email: values.email.trim(), password: values.password });
    }
  };

  const isLocked = lockedUntil !== null;

  return (
    <PageLayout
      footer={
        <AppFooter>
          <DemoAccount />
        </AppFooter>
      }
    >
      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, width: '100%' }}>
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" component="h1">
                  Log in
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Log in to see the product list.
                </Typography>
              </Box>
              {login.isError && <Alert severity="error">{describeLoginError(login.error)}</Alert>}
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                value={values.email}
                onChange={(event) => {
                  setValues((current) => ({ ...current, email: event.target.value }));
                }}
                error={fieldErrors.email !== undefined}
                helperText={fieldErrors.email}
              />
              <PasswordField
                value={values.password}
                onChange={(password) => {
                  setValues((current) => ({ ...current, password }));
                }}
                error={fieldErrors.password}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={login.isPending}
                disabled={isLocked}
              >
                Log in
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </PageLayout>
  );
}
