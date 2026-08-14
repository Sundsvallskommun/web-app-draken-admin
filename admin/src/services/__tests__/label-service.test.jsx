import { apiService } from '@services/api-service';
import { saveLabels } from '@services/label-service';

jest.mock('@services/api-service', () => ({
  apiService: {
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe('saveLabels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [true, 'post'],
    [false, 'put'],
  ])('returns the canonical labels from the %s mutation response', async (isNew, method) => {
    const labelStructure = [{ classification: 'CATEGORY', resourceName: 'BOENDE' }];
    const savedLabels = [{ id: 'created-id', ...labelStructure[0], labels: [] }];
    apiService[method].mockResolvedValue({ data: { data: savedLabels, message: 'success' } });

    await expect(saveLabels(2281, 'SUPPORT', labelStructure, isNew)).resolves.toBe(savedLabels);
    expect(apiService[method]).toHaveBeenCalledWith('/labels/2281/SUPPORT', { labelStructure });
  });
});
