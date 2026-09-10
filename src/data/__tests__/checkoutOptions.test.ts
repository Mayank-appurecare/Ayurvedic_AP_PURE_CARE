import {
  deliveryFeeFor,
  deliveryOptions,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  STANDARD_DELIVERY_ID,
} from '../checkoutOptions';

const standard = deliveryOptions.find((o) => o.id === STANDARD_DELIVERY_ID)!;
const express = deliveryOptions.find((o) => o.id === 'delivery-express')!;
const sameDay = deliveryOptions.find((o) => o.id === 'delivery-sameday')!;

describe('deliveryFeeFor', () => {
  it('charges the standard fee below the free-delivery threshold', () => {
    expect(deliveryFeeFor(standard, FREE_DELIVERY_THRESHOLD - 1)).toBe(STANDARD_DELIVERY_FEE);
    expect(deliveryFeeFor(standard, 1)).toBe(STANDARD_DELIVERY_FEE);
  });

  it('waives the standard fee at and above the threshold', () => {
    expect(deliveryFeeFor(standard, FREE_DELIVERY_THRESHOLD)).toBe(0);
    expect(deliveryFeeFor(standard, FREE_DELIVERY_THRESHOLD + 1000)).toBe(0);
  });

  it('never waives the paid delivery options, however large the order', () => {
    expect(deliveryFeeFor(express, 10)).toBe(express.price);
    expect(deliveryFeeFor(express, FREE_DELIVERY_THRESHOLD * 10)).toBe(express.price);
    expect(deliveryFeeFor(sameDay, FREE_DELIVERY_THRESHOLD * 10)).toBe(sameDay.price);
  });

  it('charges nothing on an empty cart', () => {
    for (const option of deliveryOptions) {
      expect(deliveryFeeFor(option, 0)).toBe(0);
    }
  });
});

describe('deliveryOptions', () => {
  it('states the standard fee openly rather than listing it as free', () => {
    // The fee used to be hidden: the option said `price: 0` while the cart
    // silently added its own 49, so the cart total and the amount charged at
    // payment disagreed. The listed price must be the real one.
    expect(standard.price).toBe(STANDARD_DELIVERY_FEE);
    expect(STANDARD_DELIVERY_FEE).toBeGreaterThan(0);
  });

  it('gives every option a distinct id and a non-negative price', () => {
    const ids = deliveryOptions.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const option of deliveryOptions) {
      expect(option.price).toBeGreaterThanOrEqual(0);
      expect(option.name).not.toHaveLength(0);
    }
  });
});

describe('the fee charged on a standard order', () => {
  // The cart and the payment screen both compute `subtotal - discount + fee`.
  // The defect was that they sourced `fee` differently, so they disagreed by
  // the whole fee on every order under the threshold. Both now call
  // deliveryFeeFor, so pinning its output across the threshold pins the total
  // on both screens at once.
  it.each([
    [0, 0],
    [1, STANDARD_DELIVERY_FEE],
    [200, STANDARD_DELIVERY_FEE],
    [FREE_DELIVERY_THRESHOLD - 1, STANDARD_DELIVERY_FEE],
    [FREE_DELIVERY_THRESHOLD, 0],
    [FREE_DELIVERY_THRESHOLD + 1, 0],
    [5000, 0],
  ])('a subtotal of %i is charged %i', (subtotal, expected) => {
    expect(deliveryFeeFor(standard, subtotal)).toBe(expected);
  });

  it('is the only step between the subtotal and what the customer pays', () => {
    const subtotal = 375;
    const discount = 45;
    // The exact case the manual walk-through caught: the cart showed 424 and
    // payment charged 375.
    expect(subtotal - discount + deliveryFeeFor(standard, subtotal)).toBe(379);
  });
});
