import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CopyButton } from '../layout/CopyButton';
import { DEMO_ACCOUNT } from './demo-account';

export function DemoAccount(): React.JSX.Element {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Chip label="Sandbox" color="warning" size="small" />
        <Typography variant="body2" color="text.secondary">
          Log in with the demo account:
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={3}
        useFlexGap
        sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <Credential name="Email" value={DEMO_ACCOUNT.email} />
        <Credential name="Password" value={DEMO_ACCOUNT.password} />
      </Stack>
    </Stack>
  );
}

function Credential(props: { readonly name: string; readonly value: string }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {props.name}:
      </Typography>
      <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace' }}>
        {props.value}
      </Typography>
      <CopyButton value={props.value} label={`demo ${props.name.toLowerCase()}`} />
    </Stack>
  );
}
