import { AdminStats } from '../types';
import { products } from '../data/products';
import { orders } from '../data/orders';
import { customers } from '../data/customers';
import { reviews } from '../data/reviews';

const delay = <T,>(value: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

export const AdminRepository = {
  async getDashboardStats(): Promise<AdminStats> {
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrdersCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
    const lowStockCount = products.filter((p) => p.stock <= 100).length;
    return delay({
      revenue,
      revenueChangePercent: 12.4,
      orders: orders.length,
      ordersChangePercent: 8.1,
      customers: customers.length,
      customersChangePercent: 5.6,
      products: products.length,
      lowStockCount,
      pendingOrdersCount,
      salesTrend: [
        { label: 'Mon', value: 12500 },
        { label: 'Tue', value: 15800 },
        { label: 'Wed', value: 11200 },
        { label: 'Thu', value: 18900 },
        { label: 'Fri', value: 21400 },
        { label: 'Sat', value: 26800 },
        { label: 'Sun', value: 19700 },
      ],
    });
  },

  async getBestSellers(limit = 5) {
    return delay(
      [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, limit)
    );
  },

  async getRecentOrders(limit = 5) {
    return delay([...orders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit));
  },

  async getRecentReviews(limit = 5) {
    return delay([...reviews].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit));
  },
};
