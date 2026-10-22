import { errorMessage } from '../error-message';

describe('errorMessage', () => {
  it('prefers the backend message from the axios response', () => {
    expect(errorMessage({ message: 'Request failed', response: { data: { message: 'Namespace finns redan' } } })).toBe(
      'Namespace finns redan'
    );
  });

  it('falls back to the error message and then to "fel"', () => {
    expect(errorMessage(new Error('Network Error'))).toBe('Network Error');
    expect(errorMessage({ response: { data: {} } })).toBe('fel');
    expect(errorMessage(undefined)).toBe('fel');
    expect(errorMessage('oväntat')).toBe('fel');
  });
});
