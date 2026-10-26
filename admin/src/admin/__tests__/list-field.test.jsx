import { listToText, textToList } from '../list-field';

describe('list-field', () => {
  it('shows an API array as comma-separated text', () => {
    expect(listToText(['INSPECTION', 'FOLLOW_UP'])).toBe('INSPECTION, FOLLOW_UP');
    expect(listToText(undefined)).toBe('');
    expect(listToText('A, B')).toBe('A, B');
  });

  it('parses comma-separated text into a trimmed array without empties', () => {
    expect(textToList(' INSPECTION ,FOLLOW_UP, ,')).toEqual(['INSPECTION', 'FOLLOW_UP']);
    expect(textToList('')).toEqual([]);
    expect(textToList(undefined)).toEqual([]);
  });

  it('passes an untouched array through unchanged', () => {
    expect(textToList(['A', ' B '])).toEqual(['A', 'B']);
  });
});
