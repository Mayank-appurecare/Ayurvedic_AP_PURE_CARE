import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { ArticleDetailScreen } from '../ArticleDetailScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { anArticle } from '../../../test-utils/fixtures';
import { ArticleRepository } from '../../../repositories/ArticleRepository';
import { formatDate } from '../../../utils/format';
import { Article } from '../../../types';

jest.mock('../../../repositories/ArticleRepository', () => ({
  ArticleRepository: { getById: jest.fn(), getRelated: jest.fn() },
}));

const mockGoBack = jest.fn();
const mockPush = jest.fn();
let mockRouteParams: { articleId: string };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, push: mockPush }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const ARTICLE = anArticle({
  id: 'art-ashwagandha',
  title: 'Understanding Ashwagandha',
  category: 'Herbs & Roots',
  author: 'Dr. Meera Iyer',
  date: '2026-07-01',
  readTimeMinutes: 4,
  content: [
    'Ashwagandha is a classical rasayana herb.',
    'It is traditionally taken in the evening.',
  ],
});
const RELATED = anArticle({
  id: 'art-turmeric',
  title: 'The Golden Herb: Turmeric',
  category: 'Immunity',
  date: '2026-05-22',
  readTimeMinutes: 5,
});

function mockArticle({
  article,
  related = [],
}: {
  article: Article | undefined;
  related?: Article[];
}) {
  (ArticleRepository.getById as jest.Mock).mockResolvedValue(article);
  (ArticleRepository.getRelated as jest.Mock).mockResolvedValue(related);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { articleId: ARTICLE.id };
  jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  mockArticle({ article: ARTICLE, related: [RELATED] });
});

describe('ArticleDetailScreen data loading', () => {
  it('shows the loading state until the article resolves', async () => {
    (ArticleRepository.getById as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<ArticleDetailScreen />);

    expect(await screen.findByText('Loading article...')).toBeTruthy();
  });

  it('renders the article content once loaded', async () => {
    await renderScreen(<ArticleDetailScreen />);

    expect(await screen.findByText('Understanding Ashwagandha')).toBeTruthy();
    expect(screen.getByText('Herbs & Roots')).toBeTruthy();
    expect(screen.getByText('Dr. Meera Iyer')).toBeTruthy();
    expect(screen.getByText(formatDate('2026-07-01'))).toBeTruthy();
    expect(screen.getByText('4 min read')).toBeTruthy();
    expect(screen.getByText('Ashwagandha is a classical rasayana herb.')).toBeTruthy();
    expect(screen.getByText('It is traditionally taken in the evening.')).toBeTruthy();
  });

  it('shows an error state when the article cannot be found', async () => {
    mockArticle({ article: undefined });
    await renderScreen(<ArticleDetailScreen />);

    expect(await screen.findByText('Article not found')).toBeTruthy();
  });

  it('shows an error state when loading the article rejects', async () => {
    (ArticleRepository.getById as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderScreen(<ArticleDetailScreen />);

    expect(await screen.findByText('Article not found')).toBeTruthy();
  });

  it('reloads when retry is pressed after an error', async () => {
    (ArticleRepository.getById as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await renderScreen(<ArticleDetailScreen />);

    const retry = await screen.findByRole('button', { name: 'Try Again' });
    mockArticle({ article: ARTICLE, related: [RELATED] });
    fireEvent.press(retry);

    expect(await screen.findByText('Understanding Ashwagandha')).toBeTruthy();
  });

  it('shows related articles only when there are any', async () => {
    await renderScreen(<ArticleDetailScreen />);

    expect(await screen.findByText('Related Articles')).toBeTruthy();
    expect(screen.getByText('The Golden Herb: Turmeric')).toBeTruthy();
  });

  it('hides the related articles section when there are none', async () => {
    mockArticle({ article: ARTICLE, related: [] });
    await renderScreen(<ArticleDetailScreen />);

    await screen.findByText('Understanding Ashwagandha');
    expect(screen.queryByText('Related Articles')).toBeNull();
  });
});

describe('ArticleDetailScreen navigation and actions', () => {
  it('goes back when the header back button is pressed', async () => {
    await renderScreen(<ArticleDetailScreen />);
    await screen.findByText('Understanding Ashwagandha');

    fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('pushes a new ArticleDetail screen when a related article card is pressed', async () => {
    await renderScreen(<ArticleDetailScreen />);

    fireEvent.press(await screen.findByText('The Golden Herb: Turmeric'));

    expect(mockPush).toHaveBeenCalledWith('ArticleDetail', { articleId: 'art-turmeric' });
  });

  // AppHeader's rightIcons render as icon-only buttons with no accessible
  // name of their own (only the back button gets one), so they are targeted
  // by their render position: back, then bookmark, then share.
  it('shares the article when the share icon (the third header button) is pressed', async () => {
    await renderScreen(<ArticleDetailScreen />);
    await screen.findByText('Understanding Ashwagandha');

    const headerButtons = screen.getAllByRole('button');
    expect(headerButtons).toHaveLength(3);
    fireEvent.press(headerButtons[2]);

    await waitFor(() =>
      expect(Share.share).toHaveBeenCalledWith({
        message: 'Understanding Ashwagandha — AP Pure Care',
      })
    );
  });
});
