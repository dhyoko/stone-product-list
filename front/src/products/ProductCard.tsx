import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Product } from '../api/products-api';
import { formatDate, formatPrice } from './format';

export function ProductCard({ product }: { readonly product: Product }): React.JSX.Element {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" component="h2">
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product.description}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {formatPrice(product.priceInCents, product.currency)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Added {formatDate(product.createdAt)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
