import { ArticleRepository } from '../ArticleRepository';
import { articles as mockArticles } from '../../data/articles';

// createArticle/updateArticle/deleteArticle are admin-only and out of scope.
// Nothing exercised here mutates the module-level store, so no
// jest.resetModules() dance is needed for this file.
describe('ArticleRepository', () => {
  describe('getAll', () => {
    it('returns the seed articles list', async () => {
      await expect(ArticleRepository.getAll()).resolves.toEqual(mockArticles);
    });
  });

  describe('getById', () => {
    it('finds an article by id', async () => {
      await expect(ArticleRepository.getById('art-turmeric')).resolves.toEqual(
        mockArticles.find((a) => a.id === 'art-turmeric')
      );
    });

    it('resolves undefined for an unknown id', async () => {
      await expect(ArticleRepository.getById('nope')).resolves.toBeUndefined();
    });
  });

  describe('getFeatured', () => {
    // The seed data actually has TWO articles with isFeatured: true
    // (art-ashwagandha, art-turmeric). getFeatured uses Array#find, so it
    // resolves the first one in array order, not just "some" featured article.
    it('resolves the first featured article in seed order', async () => {
      const featured = await ArticleRepository.getFeatured();
      expect(featured?.id).toBe('art-ashwagandha');
      expect(featured?.isFeatured).toBe(true);
    });
  });

  describe('getByCategory', () => {
    it('filters by an exact category string that exists in the seed data', async () => {
      const result = await ArticleRepository.getByCategory('Herbs & Roots');
      expect(result.map((a) => a.id)).toEqual(['art-ashwagandha', 'art-turmeric']);
    });

    it('resolves an empty list for a category with no articles', async () => {
      await expect(ArticleRepository.getByCategory('Nonexistent Category')).resolves.toEqual([]);
    });
  });

  describe('getRelated', () => {
    it('returns other articles sharing the same category, excluding itself', async () => {
      // art-ashwagandha and art-turmeric are the only two "Herbs & Roots" articles.
      const result = await ArticleRepository.getRelated('art-ashwagandha');
      expect(result.map((a) => a.id)).toEqual(['art-turmeric']);
    });

    it('respects the limit', async () => {
      await expect(ArticleRepository.getRelated('art-ashwagandha', 0)).resolves.toEqual([]);
    });

    it('resolves an empty list for an unknown id', async () => {
      await expect(ArticleRepository.getRelated('nope')).resolves.toEqual([]);
    });
  });

  describe('search', () => {
    it('matches case-insensitively against the title', async () => {
      // "The Golden Herb: Turmeric in Ayurveda" is the only title containing "golden".
      const result = await ArticleRepository.search('GOLDEN');
      expect(result.map((a) => a.id)).toEqual(['art-turmeric']);
    });

    it('matches case-insensitively against tags', async () => {
      // No title mentions "Triphala"; only art-digestion carries it as a tag.
      const result = await ArticleRepository.search('TRIPHALA');
      expect(result.map((a) => a.id)).toEqual(['art-digestion']);
    });

    it('resolves an empty list for a blank/whitespace query', async () => {
      await expect(ArticleRepository.search('   ')).resolves.toEqual([]);
    });
  });
});
