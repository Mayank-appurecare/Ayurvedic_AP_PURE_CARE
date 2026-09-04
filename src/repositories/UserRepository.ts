// Mock authentication + account repository. No real backend, tokens or
// persistence beyond AsyncStorage for session continuity across app reloads.
import { Address, User } from '../types';
import { addresses as mockAddresses } from '../data/addresses';

const delay = <T,>(value: T, ms = 500): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

let addressStore: Address[] = [...mockAddresses];

const MOCK_OTP = '1234';

export const UserRepository = {
  async login(identifier: string, password: string): Promise<User> {
    if (!identifier || !password) {
      throw new Error('Please enter both your mobile/email and password.');
    }
    if (password.length < 4) {
      throw new Error('Incorrect password. Please try again.');
    }
    return delay({
      id: 'user-1',
      name: 'Mayank Sharma',
      email: identifier.includes('@') ? identifier : 'mayank@example.com',
      phone: identifier.includes('@') ? '+91 98765 43210' : identifier,
      isGuest: false,
    });
  },

  async register(params: { fullName: string; mobile: string; email: string; password: string }): Promise<User> {
    return delay({
      id: 'user-1',
      name: params.fullName,
      email: params.email,
      phone: params.mobile,
      isGuest: false,
    });
  },

  async continueAsGuest(): Promise<User> {
    return delay({ id: 'guest', name: 'Guest', email: '', phone: '', isGuest: true }, 200);
  },

  async sendOtp(_mobile: string): Promise<{ sent: boolean }> {
    return delay({ sent: true }, 400);
  },

  async verifyOtp(otp: string): Promise<{ verified: boolean }> {
    if (otp !== MOCK_OTP) {
      throw new Error('Invalid OTP. Please try again.');
    }
    return delay({ verified: true }, 400);
  },

  async getAddresses(): Promise<Address[]> {
    return delay([...addressStore]);
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const newAddress: Address = { ...address, id: `addr-${Date.now()}` };
    addressStore = [...addressStore, newAddress];
    return delay(newAddress);
  },

  async updateAddress(address: Address): Promise<Address> {
    addressStore = addressStore.map((a) => (a.id === address.id ? address : a));
    return delay(address);
  },

  async deleteAddress(id: string): Promise<void> {
    addressStore = addressStore.filter((a) => a.id !== id);
    return delay(undefined);
  },
};
