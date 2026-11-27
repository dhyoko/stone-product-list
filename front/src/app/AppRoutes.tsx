import { Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '../login/LoginPage';
import { ProductsPage } from '../products/ProductsPage';
import { RequireSession } from '../session/RequireSession';

export function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/products"
        element={
          <RequireSession>
            <ProductsPage />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
