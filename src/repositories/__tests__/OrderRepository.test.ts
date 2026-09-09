// OrderRepository keeps its state in module-level `ordersStore`/`orderSequence`
// variables that live for as long as the module stays loaded — NOT reset the
// way component state would be. Any test calling a mutating method
// (placeOrder/cancelOrder/updateStatus) would otherwise permanently change
// that state for every later test in this file, since Jest does not reload a
// module between `it()` blocks by default. So every test below forces a
// completely fresh module instance via `jest.resetModules()` + a dynamic
// `require()` in `beforeEach`, instead of a static top-of-file `import` —
// mirroring the same pattern already used in
// src/services/catalog/__tests__/catalogStore.test.ts for the same reason.
//
// It is safe to statically import type-only things (Address, OrderItem,
// OrderStatus) because types carry no runtime module state of their own.
import { Address, OrderItem, OrderStatus } from '../../types';

let OrderRepository: typeof import('../OrderRepository').OrderRepository;

beforeEach(() => {
  jest.resetModules();
  OrderRepository = require('../OrderRepository').OrderRepository;
});

const TEST_ADDRESS: Address = {
  id: 'addr-test',
  label: 'Home',
  fullName: 'Test User',
  phone: '9999999999',
  line1: '1 Test Street',
  city: 'Test City',
  state: 'Test State',
  pincode: '123456',
};

const TEST_ITEMS: OrderItem[] = [
  {
    productId: 'p-test-product',
    variantId: 'v-test-variant',
    name: 'Test Product',
    image: 'https://example.com/test.png',
    variantLabel: 'Standard',
    quantity: 2,
    price: 100,
  },
];

function placeOrderParams(
  overrides: Partial<Parameters<typeof OrderRepository.placeOrder>[0]> = {}
) {
  return {
    items: TEST_ITEMS,
    subtotal: 200,
    discount: 0,
    deliveryFee: 0,
    total: 200,
    address: TEST_ADDRESS,
    paymentMethod: 'UPI',
    ...overrides,
  };
}

/** Steps in the order they appear in every non-cancelled timeline. */
const NON_CANCELLED_STEPS: OrderStatus[] = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

describe('getAll', () => {
  it('returns the seed orders sorted with the newest date first', async () => {
    const result = await OrderRepository.getAll();
    // Seed dates (src/data/orders.ts): ord-1 2026-08-28, ord-2 2026-08-15,
    // ord-3 2026-07-22, ord-4 2026-09-01.
    expect(result.map((o) => o.id)).toEqual(['ord-4', 'ord-1', 'ord-2', 'ord-3']);
  });
});

describe('getById', () => {
  it('finds a real seed order', async () => {
    const result = await OrderRepository.getById('ord-2');
    expect(result?.status).toBe('delivered');
  });

  it('resolves undefined for a made-up id', async () => {
    await expect(OrderRepository.getById('ord-does-not-exist')).resolves.toBeUndefined();
  });
});

describe('getByStatusGroup', () => {
  // Real seed statuses: ord-1 out_for_delivery, ord-2 delivered,
  // ord-3 cancelled, ord-4 confirmed.
  it("'delivered' returns only the delivered seed order", async () => {
    const result = await OrderRepository.getByStatusGroup('delivered');
    expect(result.map((o) => o.id)).toEqual(['ord-2']);
  });

  it("'cancelled' returns only the cancelled seed order", async () => {
    const result = await OrderRepository.getByStatusGroup('cancelled');
    expect(result.map((o) => o.id)).toEqual(['ord-3']);
  });

  it("'ongoing' returns every order that is neither delivered nor cancelled", async () => {
    const result = await OrderRepository.getByStatusGroup('ongoing');
    expect(result.map((o) => o.id).sort()).toEqual(['ord-1', 'ord-4'].sort());
  });

  it("'all' returns every seed order", async () => {
    const result = await OrderRepository.getByStatusGroup('all');
    expect(result.map((o) => o.id).sort()).toEqual(['ord-1', 'ord-2', 'ord-3', 'ord-4'].sort());
  });
});

describe('placeOrder', () => {
  it('creates an order with status "placed" and only the placed timeline step completed', async () => {
    const order = await OrderRepository.placeOrder(placeOrderParams());

    expect(order.status).toBe('placed');
    expect(order.timeline).toHaveLength(NON_CANCELLED_STEPS.length);
    expect(order.timeline.map((s) => s.status)).toEqual(NON_CANCELLED_STEPS);

    const [placedStep, ...restSteps] = order.timeline;
    expect(placedStep.completed).toBe(true);
    expect(placedStep.timestamp).not.toBe('');
    for (const step of restSteps) {
      expect(step.completed).toBe(false);
      expect(step.timestamp).toBe('');
    }
  });

  it('increases the orderNumber between two separate calls', async () => {
    const first = await OrderRepository.placeOrder(placeOrderParams());
    const second = await OrderRepository.placeOrder(placeOrderParams());

    const firstSeq = Number(first.orderNumber.replace(/^OJA/, ''));
    const secondSeq = Number(second.orderNumber.replace(/^OJA/, ''));

    expect(Number.isNaN(firstSeq)).toBe(false);
    expect(Number.isNaN(secondSeq)).toBe(false);
    expect(secondSeq).toBeGreaterThan(firstSeq);
  });

  it('is included at the front of a following getAll()', async () => {
    const placed = await OrderRepository.placeOrder(placeOrderParams());

    const all = await OrderRepository.getAll();

    // Placed "today" (2026-09-09 at time of writing), which sorts ahead of
    // every seed order — the latest of which is 2026-09-01 — regardless of
    // the comparator's tie-breaking behavior for same-day orders.
    expect(all[0].id).toBe(placed.id);
  });
});

describe('cancelOrder', () => {
  it('sets status to cancelled and produces a 3-step, fully-completed timeline', async () => {
    const cancelled = await OrderRepository.cancelOrder('ord-1');

    expect(cancelled?.status).toBe('cancelled');
    expect(cancelled?.timeline).toHaveLength(3);
    expect(cancelled?.timeline.map((s) => s.status)).toEqual(['placed', 'confirmed', 'cancelled']);
    for (const step of cancelled?.timeline ?? []) {
      expect(step.completed).toBe(true);
      expect(step.timestamp).not.toBe('');
    }
  });

  it('returns undefined for an unknown id', async () => {
    await expect(OrderRepository.cancelOrder('ord-does-not-exist')).resolves.toBeUndefined();
  });
});

describe('updateStatus', () => {
  it('marks every step up to and including the given status completed, and leaves later steps not completed', async () => {
    // ord-4 starts at 'confirmed' (index 1); move it to 'shipped' (index 3).
    const updated = await OrderRepository.updateStatus('ord-4', 'shipped');

    expect(updated?.status).toBe('shipped');
    const shippedIndex = NON_CANCELLED_STEPS.indexOf('shipped');
    updated?.timeline.forEach((step, index) => {
      if (index <= shippedIndex) {
        expect(step.completed).toBe(true);
        expect(step.timestamp).not.toBe('');
      } else {
        expect(step.completed).toBe(false);
        expect(step.timestamp).toBe('');
      }
    });
  });

  it('returns undefined for an unknown id', async () => {
    await expect(
      OrderRepository.updateStatus('ord-does-not-exist', 'shipped')
    ).resolves.toBeUndefined();
  });
});

describe('reorder', () => {
  it('returns productId/variantId/quantity triples matching a real seed order, stripped of other fields', async () => {
    // ord-1 (src/data/orders.ts) has two items.
    const result = await OrderRepository.reorder('ord-1');

    expect(result).toEqual([
      { productId: 'p-ashwagandha-capsules', variantId: 'v-ashwa-60', quantity: 1 },
      { productId: 'p-triphala-churna', variantId: 'v-triphala-200', quantity: 2 },
    ]);
  });

  it('returns [] for an unknown id', async () => {
    await expect(OrderRepository.reorder('ord-does-not-exist')).resolves.toEqual([]);
  });
});
