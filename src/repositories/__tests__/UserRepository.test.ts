import type { Address } from '../../types';
import { addresses as mockAddresses } from '../../data/addresses';
import { anAddress } from '../../test-utils/fixtures';

describe('UserRepository', () => {
  // Addresses live in a module-level array seeded once from src/data/addresses.
  // Resetting the module registry before every test re-runs that seeding fresh,
  // so a mutation in one test (addAddress/updateAddress/deleteAddress) never
  // leaks into a later test in this file.
  let UserRepository: typeof import('../UserRepository').UserRepository;

  beforeEach(() => {
    jest.resetModules();
    UserRepository = require('../UserRepository').UserRepository;
  });

  describe('login', () => {
    it('rejects an empty identifier', async () => {
      await expect(UserRepository.login('', 'password123')).rejects.toThrow(
        'Please enter both your mobile/email and password.'
      );
    });

    it('rejects an empty password', async () => {
      await expect(UserRepository.login('9876543210', '')).rejects.toThrow(
        'Please enter both your mobile/email and password.'
      );
    });

    it('rejects a password under 4 characters', async () => {
      await expect(UserRepository.login('9876543210', 'abc')).rejects.toThrow(
        'Incorrect password. Please try again.'
      );
    });

    it('derives email/phone from an email identifier', async () => {
      const user = await UserRepository.login('someone@example.com', 'password123');
      expect(user).toEqual({
        id: 'user-1',
        name: 'Mayank Sharma',
        email: 'someone@example.com',
        phone: '+91 98765 43210',
        isGuest: false,
      });
    });

    it('derives email/phone from a phone identifier', async () => {
      const user = await UserRepository.login('9876543210', 'password123');
      expect(user).toEqual({
        id: 'user-1',
        name: 'Mayank Sharma',
        email: 'mayank@example.com',
        phone: '9876543210',
        isGuest: false,
      });
    });
  });

  describe('register', () => {
    it('builds a user from the given params', async () => {
      const user = await UserRepository.register({
        fullName: 'Test User',
        mobile: '9999999999',
        email: 'test@example.com',
        password: 'pass1234',
      });
      expect(user).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '9999999999',
        isGuest: false,
      });
    });
  });

  describe('continueAsGuest', () => {
    it('resolves a guest user', async () => {
      await expect(UserRepository.continueAsGuest()).resolves.toEqual({
        id: 'guest',
        name: 'Guest',
        email: '',
        phone: '',
        isGuest: true,
      });
    });
  });

  // DEPRECATED — kept only so the unrouted RegisterScreen keeps compiling.
  describe('sendOtp', () => {
    it('always resolves sent: true', async () => {
      await expect(UserRepository.sendOtp('9876543210')).resolves.toEqual({ sent: true });
    });
  });

  describe('verifyOtp', () => {
    it('resolves verified: true for the hardcoded mock code', async () => {
      await expect(UserRepository.verifyOtp('1234')).resolves.toEqual({ verified: true });
    });

    it('rejects any other code', async () => {
      await expect(UserRepository.verifyOtp('0000')).rejects.toThrow(
        'Invalid OTP. Please try again.'
      );
    });
  });

  describe('addresses', () => {
    it('getAddresses returns the seed list', async () => {
      await expect(UserRepository.getAddresses()).resolves.toEqual(mockAddresses);
    });

    it('addAddress appends a new address with a generated id', async () => {
      const { id, ...input } = anAddress({ label: 'Other', city: 'Mumbai' });
      const created = await UserRepository.addAddress(input);

      expect(created).toEqual({ ...input, id: expect.any(String) });

      const all = await UserRepository.getAddresses();
      expect(all).toHaveLength(mockAddresses.length + 1);
      expect(all).toContainEqual(created);
    });

    it('updateAddress replaces the matching address by id', async () => {
      const updated: Address = { ...mockAddresses[0], label: 'Office', city: 'Mumbai' };
      const result = await UserRepository.updateAddress(updated);
      expect(result).toEqual(updated);

      const all = await UserRepository.getAddresses();
      expect(all.find((a) => a.id === updated.id)).toEqual(updated);
      expect(all).toHaveLength(mockAddresses.length);
    });

    it('deleteAddress removes the address by id', async () => {
      const [target] = mockAddresses;
      await UserRepository.deleteAddress(target.id);

      const all = await UserRepository.getAddresses();
      expect(all.find((a) => a.id === target.id)).toBeUndefined();
      expect(all).toHaveLength(mockAddresses.length - 1);
    });
  });
});
