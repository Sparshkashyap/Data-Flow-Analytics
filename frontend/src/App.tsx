import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import ShipmentsPage from './pages/ShipmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CountriesPage from './pages/CountriesPage';
import DataQualityPage from './pages/DataQualityPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/countries" element={<CountriesPage />} />
        <Route path="/quality" element={<DataQualityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
