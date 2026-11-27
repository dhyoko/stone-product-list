import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';
import { DOC_LINKS } from './doc-links';

export function AppFooter({ children }: { readonly children?: ReactNode }): React.JSX.Element {
  return (
    <Box
      component="footer"
      sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', py: 3 }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          {children}
          <Stack
            component="nav"
            aria-label="Documentation"
            direction="row"
            spacing={3}
            useFlexGap
            sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {DOC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                underline="hover"
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
