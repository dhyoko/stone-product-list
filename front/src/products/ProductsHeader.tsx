import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useLogOut } from '../session/use-log-out';
import { useCurrentUser } from './use-current-user';

export function ProductsHeader(): React.JSX.Element {
  const currentUser = useCurrentUser();
  const logOut = useLogOut();
  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Product list
        </Typography>
        {currentUser.isPending ? (
          <Skeleton width={96} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {currentUser.data?.name}
          </Typography>
        )}
        <Button variant="outlined" onClick={logOut}>
          Log out
        </Button>
      </Toolbar>
    </AppBar>
  );
}
