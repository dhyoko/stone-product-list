import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function ProductsPage(): React.JSX.Element {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1">
        Products
      </Typography>
    </Container>
  );
}
