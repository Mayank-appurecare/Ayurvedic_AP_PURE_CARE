import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ArticlesScreen } from '../ArticlesScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { anArticle } from '../../../test-utils/fixtures';
import { ArticleRepository } from '../../../repositories/ArticleRepository';
import { Article } from '../../../types';

jest.mock('../../../repositories/ArticleRepository', () => ({
  ArticleRepository: { getAll: jest.fn(), getFeatured: jest.fn() },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

function mockArticles({ all, featured }: { all: Article[]; featured?: Article }) {
  (ArticleRepository.getAll as jest.Mock).mockResolvedValue(all);
  (ArticleRepository.getFeatured as jest.Mock).mockResolvedValue(featured);
}

// Real category names from src/data/articles.ts — the screen's category chips
// come from that module directly, not from the mocked repository, so tests
// reuse the same categories to exercise the actual chip filter.
const FEATURED = anArticle({
  id: 'art-ashwagandha',
  title: 'Understanding Ashwagandha',
  category: 'Herbs & Roots',
  tags: ['ashwagandha', 'adaptogen'],
});
const ALOE = anArticle({
  id: 'art-aloe-vera',
  title: 'How to Use Aloe Vera',
  category: 'Skin Care',
  tags: ['aloe vera'],
});
const SLEEP = anArticle({
  id: 'art-sleep-tips',
  title: '5 Tips for Better Sleep',
  category: 'Lifestyle',
  tags: ['sleep'],
});

beforeEach(() => {
  jest.clearAllMocks();
  mockArticles({ all: [FEATURED, ALOE, SLEEP], featured: FEATURED });
});

describe('ArticlesScreen data loading', () => {
  it('shows the loading state until both requests resolve', async () => {
    (ArticleRepository.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<ArticlesScreen />);

    expect(await screen.findByText('Loading articles...')).toBeTruthy();
  });

  it('shows the featured article and the rest of the list once loaded', async () => {
    await renderScreen(<ArticlesScreen />);

    expect(await screen.findByText('Featured')).toBeTruthy();
    expect(screen.getByText('Understanding Ashwagandha')).toBeTruthy();
    expect(screen.getByText('All Articles')).toBeTruthy();
    expect(screen.getByText('How to Use Aloe Vera')).toBeTruthy();
    expect(screen.getByText('5 Tips for Better Sleep')).toBeTruthy();
  });

  // The featured article is excluded from the regular list so it isn't shown twice.
  it('does not repeat the featured article inside the All Articles list', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('Featured');

    expect(screen.getAllByText('Understanding Ashwagandha')).toHaveLength(1);
  });

  it('shows the empty state when no article has been marked featured', async () => {
    mockArticles({ all: [ALOE, SLEEP], featured: undefined });
    await renderScreen(<ArticlesScreen />);

    await screen.findByText('How to Use Aloe Vera');
    expect(screen.queryByText('Featured')).toBeNull();
  });
});

describe('ArticlesScreen search and filtering', () => {
  it('filters the list by title as the user types', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('How to Use Aloe Vera');

    fireEvent.changeText(await screen.findByPlaceholderText('Search articles'), 'sleep');

    expect(await screen.findByText('5 Tips for Better Sleep')).toBeTruthy();
    expect(screen.queryByText('How to Use Aloe Vera')).toBeNull();
  });

  it('filters the list by tag as well as title', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('How to Use Aloe Vera');

    fireEvent.changeText(await screen.findByPlaceholderText('Search articles'), 'aloe vera');

    expect(await screen.findByText('How to Use Aloe Vera')).toBeTruthy();
    expect(screen.queryByText('5 Tips for Better Sleep')).toBeNull();
  });

  it('hides the Featured section while a search query is active', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('Featured');

    fireEvent.changeText(await screen.findByPlaceholderText('Search articles'), 'sleep');

    await waitFor(() => expect(screen.queryByText('Featured')).toBeNull());
  });

  it('shows the empty state when no article matches the search', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('How to Use Aloe Vera');

    fireEvent.changeText(await screen.findByPlaceholderText('Search articles'), 'no such herb');

    expect(await screen.findByText('No articles found')).toBeTruthy();
  });

  it('filters the list to a single category when its chip is pressed', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('How to Use Aloe Vera');

    // "Skin Care" also appears as the ALOE card's own category label, so the
    // chip (which renders first, above the list) is index 0.
    const [skinCareChip] = await screen.findAllByText('Skin Care');
    fireEvent.press(skinCareChip);

    await waitFor(() => expect(screen.queryByText('5 Tips for Better Sleep')).toBeNull());
    expect(screen.getByText('How to Use Aloe Vera')).toBeTruthy();
  });

  it('the "All" chip clears an active category filter', async () => {
    await renderScreen(<ArticlesScreen />);
    await screen.findByText('How to Use Aloe Vera');

    const [skinCareChip] = await screen.findAllByText('Skin Care');
    fireEvent.press(skinCareChip);
    await waitFor(() => expect(screen.queryByText('5 Tips for Better Sleep')).toBeNull());

    fireEvent.press(await screen.findByText('All'));

    expect(await screen.findByText('5 Tips for Better Sleep')).toBeTruthy();
  });
});

describe('ArticlesScreen navigation', () => {
  it('opens the featured article when its card is pressed', async () => {
    await renderScreen(<ArticlesScreen />);

    fireEvent.press(await screen.findByText('Understanding Ashwagandha'));

    expect(mockNavigate).toHaveBeenCalledWith('ArticleDetail', { articleId: 'art-ashwagandha' });
  });

  it('opens an article from the list when its card is pressed', async () => {
    await renderScreen(<ArticlesScreen />);

    fireEvent.press(await screen.findByText('How to Use Aloe Vera'));

    expect(mockNavigate).toHaveBeenCalledWith('ArticleDetail', { articleId: 'art-aloe-vera' });
  });

  it('goes back when the header back button is pressed', async () => {
    await renderScreen(<ArticlesScreen />);

    fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});
