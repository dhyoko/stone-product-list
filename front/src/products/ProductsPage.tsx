import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { describeApiError } from '../api/describe-api-error';
import { ProductCard } from './ProductCard';
import { ProductsHeader } from './ProductsHeader';
import { PRODUCTS_PAGE_SIZE, useProducts } from './use-products';

const CARD_SIZE = { xs: 12, sm: 6, md: 4 };

export function ProductsPage(): React.JSX.Element {
  return (
    <>
      <ProductsHeader />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Products
        </Typography>
        <ProductList />
      </Container>
    </>
  );
}

function ProductList(): React.JSX.Element {
  const products = useProducts();

  if (products.isPending) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: PRODUCTS_PAGE_SIZE }, (_, index) => (
          <Grid key={index} size={CARD_SIZE}>
            <Skeleton variant="rounded" height={160} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (products.data === undefined) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              void products.refetch();
            }}
          >
            Try again
          </Button>
        }
      >
        {describeApiError(products.error)}
      </Alert>
    );
  }

  const items = products.data.pages.flatMap((page) => page.items);
  if (items.length === 0) {
    return <Typography color="text.secondary">There are no products yet.</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {items.map((product) => (
          <Grid key={product.id} size={CARD_SIZE}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      {products.isError && <Alert severity="error">{describeApiError(products.error)}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {products.hasNextPage ? (
          <Button
            variant="contained"
            loading={products.isFetchingNextPage}
            onClick={() => {
              void products.fetchNextPage();
            }}
          >
            Load more
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary">
            You have seen all {items.length} products.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
