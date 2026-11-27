import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function PageLayout(props: {
  readonly header?: ReactNode;
  readonly footer: ReactNode;
  readonly children: ReactNode;
}): React.JSX.Element {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {props.header}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {props.children}
      </Box>
      {props.footer}
    </Box>
  );
}
