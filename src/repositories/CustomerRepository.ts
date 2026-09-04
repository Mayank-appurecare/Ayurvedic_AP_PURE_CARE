import { customers as mockCustomers } from '../data/customers';
import { Customer } from '../types';

const delay = <T,>(value: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

export const CustomerRepository = {
  async getAll(): Promise<Customer[]> {
    return delay(mockCustomers);
  },
  async getById(id: string): Promise<Customer | undefined> {
    return delay(mockCustomers.find((c) => c.id === id));
  },
  async search(query: string): Promise<Customer[]> {
    const q = query.trim().toLowerCase();
    if (!q) return delay(mockCustomers);
    return delay(
      mockCustomers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  },
};
