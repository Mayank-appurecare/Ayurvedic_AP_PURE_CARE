import React from 'react';
import { useWindowDimensions } from 'react-native';
import { screen, fireEvent } from '@testing-library/react-native';
import { CategoriesScreen } from '../CategoriesScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { aCategory, aConcern } from '../../../test-utils/fixtures';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { categoryGridColumns } from '../../../theme';
import { Category, Concern } from '../../../types';

jest.mock('../../../repositories/CategoryRepository', () => ({
  CategoryRepository: { getAll: jest.fn(), getConcerns: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// The grid column count comes from the live window width, so the width has to
// be controllable to test the responsive behaviour at all.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions');

// Keeps the real breakpoint logic (so the grid renders normally) while making
// the call observable.
jest.mock('../../../theme', () => {
  const actual = jest.requireActual('../../../theme');
  return { ...actual, categoryGridColumns: jest.fn(actual.categoryGridColumns) };
});

function mockWidth(width: number) {
  (useWindowDimensions as unknown as jest.Mock).mockReturnValue({
    width,
    height: 844,
    scale: 2,
    fontScale: 1,
  });
}

function mockRepository({
  categories = [aCategory()],
  concerns = [aConcern()],
}: { categories?: Category[]; concerns?: Concern[] } = {}) {
  (CategoryRepository.getAll as jest.Mock).mockResolvedValue(categories);
  (CategoryRepository.getConcerns as jest.Mock).mockResolvedValue(concerns);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWidth(390);
  mockRepository();
});

describe('CategoriesScreen data loading', () => {
  it('shows the loading state until both requests resolve', async () => {
    (CategoryRepository.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<CategoriesScreen />);

    expect(await screen.findByText('Loading categories...')).toBeTruthy();
  });

  it('renders both section headings once loaded', async () => {
    await renderScreen(<CategoriesScreen />);

    await screen.findByText('All Categories');
    expect(screen.getByText('Shop by Concern')).toBeTruthy();
  });

  it('renders a card per category, with its name and product count', async () => {
    mockRepository({
      categories: [
        aCategory({ id: '1', name: 'Digestive Care', productCount: 18 }),
        aCategory({ id: '59', name: 'Eye Care', productCount: 3 }),
      ],
    });
    await renderScreen(<CategoriesScreen />);

    expect(await screen.findByText('Digestive Care')).toBeTruthy();
    expect(screen.getByText('18 products')).toBeTruthy();
    expect(screen.getByText('Eye Care')).toBeTruthy();
    expect(screen.getByText('3 products')).toBeTruthy();
  });

  // A category with nothing in it still belongs on the grid; hiding it would
  // make the catalog look smaller than it is.
  it('still shows a category that has no products', async () => {
    mockRepository({ categories: [aCategory({ id: '59', name: 'Eye Care', productCount: 0 })] });
    await renderScreen(<CategoriesScreen />);

    expect(await screen.findByText('Eye Care')).toBeTruthy();
    expect(screen.getByText('0 products')).toBeTruthy();
  });

  it('renders a chip per concern', async () => {
    mockRepository({
      concerns: [
        aConcern({ id: '2', name: 'Acidity' }),
        aConcern({ id: '3', name: 'Constipation' }),
      ],
    });
    await renderScreen(<CategoriesScreen />);

    expect(await screen.findByText('Acidity')).toBeTruthy();
    expect(screen.getByText('Constipation')).toBeTruthy();
  });

  it('shows the error state when a request rejects', async () => {
    (CategoryRepository.getAll as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderScreen(<CategoriesScreen />);

    expect(await screen.findByText("We couldn't load categories.")).toBeTruthy();
  });

  it('reloads when retry is pressed after an error', async () => {
    (CategoryRepository.getAll as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await renderScreen(<CategoriesScreen />);

    const retry = await screen.findByRole('button', { name: 'Try Again' });
    mockRepository({ categories: [aCategory({ name: 'Hair Care' })] });
    fireEvent.press(retry);

    expect(await screen.findByText('Hair Care')).toBeTruthy();
  });
});

describe('CategoriesScreen navigation', () => {
  it('opens a category listing with that category id and name', async () => {
    mockRepository({ categories: [aCategory({ id: '31', name: 'Hair Care' })] });
    await renderScreen(<CategoriesScreen />);

    fireEvent.press(await screen.findByText('Hair Care'));

    expect(mockNavigate).toHaveBeenCalledWith('CategoryProducts', {
      categoryId: '31',
      categoryName: 'Hair Care',
    });
  });

  // A concern is a sub-service, so it filters by concernId and deliberately
  // sends an empty categoryId — the listing must not also filter by category.
  it('opens a concern listing with an empty categoryId and the concern id', async () => {
    mockRepository({ concerns: [aConcern({ id: '33', name: 'Dandruff' })] });
    await renderScreen(<CategoriesScreen />);

    fireEvent.press(await screen.findByText('Dandruff'));

    expect(mockNavigate).toHaveBeenCalledWith('CategoryProducts', {
      categoryId: '',
      categoryName: 'Dandruff',
      concernId: '33',
    });
  });

  it('goes to the Home tab from the header back button', async () => {
    await renderScreen(<CategoriesScreen />);

    fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockNavigate).toHaveBeenCalledWith('HomeTab');
  });
});

/**
 * The grid must show exactly three cards per row on phones and widen on larger
 * screens. The breakpoint table itself is covered exhaustively in
 * theme/__tests__/spacing.test.ts; what this screen owns is asking that helper
 * about the LIVE window width, so the grid reflows on rotation or resize rather
 * than keeping whatever the first render happened to see.
 */
describe('CategoriesScreen responsive grid', () => {
  it.each([320, 390, 414, 599, 600, 768, 1024, 1280])(
    'asks for a column count using the current width (%ipx)',
    async (width) => {
      mockWidth(width);
      mockRepository({ categories: [aCategory({ name: 'Digestive Care' })] });
      await renderScreen(<CategoriesScreen />);
      await screen.findByText('Digestive Care');

      expect(categoryGridColumns).toHaveBeenCalledWith(width);
    }
  );
});
