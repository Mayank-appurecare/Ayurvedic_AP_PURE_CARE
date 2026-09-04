import { orders as mockOrders } from '../data/orders';
import { Address, CartItem, Order, OrderItem, OrderStatus } from '../types';

const delay = <T,>(value: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so newly placed orders persist for the session.
let ordersStore: Order[] = [...mockOrders];
let orderSequence = 24500;

function buildTimeline(status: OrderStatus) {
  const now = new Date().toISOString();

  if (status === 'cancelled') {
    return [
      { status: 'placed' as OrderStatus, label: 'Order Placed', timestamp: now, completed: true },
      { status: 'confirmed' as OrderStatus, label: 'Confirmed', timestamp: now, completed: true },
      { status: 'cancelled' as OrderStatus, label: 'Cancelled', timestamp: now, completed: true },
    ];
  }

  const steps: { status: OrderStatus; label: string }[] = [
    { status: 'placed', label: 'Order Placed' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'packed', label: 'Packed' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'out_for_delivery', label: 'Out for Delivery' },
    { status: 'delivered', label: 'Delivered' },
  ];
  const currentIndex = steps.findIndex((s) => s.status === status);
  return steps.map((step, index) => ({
    ...step,
    timestamp: index <= currentIndex ? now : '',
    completed: index <= currentIndex,
  }));
}

export const OrderRepository = {
  async getAll(): Promise<Order[]> {
    return delay([...ordersStore].sort((a, b) => (a.date < b.date ? 1 : -1)));
  },

  async getById(id: string): Promise<Order | undefined> {
    return delay(ordersStore.find((o) => o.id === id));
  },

  async getByStatusGroup(group: 'ongoing' | 'delivered' | 'cancelled' | 'all'): Promise<Order[]> {
    const all = await this.getAll();
    if (group === 'all') return all;
    if (group === 'delivered') return all.filter((o) => o.status === 'delivered');
    if (group === 'cancelled') return all.filter((o) => o.status === 'cancelled');
    return all.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  },

  async placeOrder(params: {
    items: OrderItem[];
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    address: Address;
    paymentMethod: string;
  }): Promise<Order> {
    orderSequence += 1;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `OJA${orderSequence}`,
      date: new Date().toISOString().slice(0, 10),
      status: 'placed',
      items: params.items,
      subtotal: params.subtotal,
      discount: params.discount,
      deliveryFee: params.deliveryFee,
      total: params.total,
      address: params.address,
      paymentMethod: params.paymentMethod,
      deliveryEstimate: 'Arriving in 3-4 days',
      timeline: buildTimeline('placed'),
    };
    ordersStore = [newOrder, ...ordersStore];
    return delay(newOrder, 600);
  },

  async cancelOrder(id: string): Promise<Order | undefined> {
    ordersStore = ordersStore.map((o) =>
      o.id === id ? { ...o, status: 'cancelled', timeline: buildTimeline('cancelled') } : o
    );
    return delay(ordersStore.find((o) => o.id === id));
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    ordersStore = ordersStore.map((o) => (o.id === id ? { ...o, status, timeline: buildTimeline(status) } : o));
    return delay(ordersStore.find((o) => o.id === id));
  },

  async reorder(id: string): Promise<CartItem[]> {
    const order = ordersStore.find((o) => o.id === id);
    if (!order) return delay([]);
    return delay(order.items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })));
  },
};
