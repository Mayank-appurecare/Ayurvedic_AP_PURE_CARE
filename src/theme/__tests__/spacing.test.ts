import { categoryGridColumns } from '../spacing';

/**
 * Drives the Categories grid. The requirement is exactly three cards per row on
 * phones — four would truncate names to "Ba…" / "Di…" — widening on tablets and
 * desktop. Boundaries are asserted on both sides so an off-by-one in a
 * comparison cannot slip through.
 */
describe('categoryGridColumns', () => {
  it.each([320, 360, 375, 390, 414, 480, 599])('gives 3 columns at %ipx (phone)', (width) => {
    expect(categoryGridColumns(width)).toBe(3);
  });

  it.each([
    [600, 4],
    [767, 4],
    [768, 5],
    [1023, 5],
    [1024, 6],
    [1279, 6],
    [1280, 7],
    [1920, 7],
  ])('gives %i px -> %i columns', (width, expected) => {
    expect(categoryGridColumns(width)).toBe(expected);
  });

  it('never returns fewer than 3, even at an absurdly small width', () => {
    expect(categoryGridColumns(0)).toBe(3);
    expect(categoryGridColumns(120)).toBe(3);
  });

  it('never returns more than 7, however wide the screen', () => {
    expect(categoryGridColumns(5000)).toBe(7);
  });
});
