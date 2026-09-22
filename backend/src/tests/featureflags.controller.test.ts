import 'reflect-metadata';
import { FeatureFlagController } from '@controllers/featureflags.controller';
import prisma from '@/utils/prisma';

// The real logger reads LOG_DIR from .env.<NODE_ENV>.local at import time, which this suite
// does not need and which is not present in CI/dev checkouts.
jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() }, stream: { write: jest.fn() } }));

jest.mock('@/utils/prisma', () => ({ __esModule: true, default: { featureFlags: { update: jest.fn() } } }));

const update = prisma.featureFlags.update as unknown as jest.Mock;

const makeRes = () => {
  const res: any = {};
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const req: any = { user: { permissions: { canUseAdminPanel: true } } };

describe('FeatureFlagController.updateFeatureFlag', () => {
  beforeEach(() => update.mockReset());

  it('takes the id from the url when the body omits it', async () => {
    update.mockResolvedValue({ id: 5, name: 'flag', enabled: true });
    const res = makeRes();

    await new FeatureFlagController().updateFeatureFlag(req, 2281, 5, { enabled: true }, res);

    expect(update).toHaveBeenCalledWith({
      where: { id: 5, municipalityId: 2281 },
      data: expect.objectContaining({ enabled: true }),
    });
    expect(res.send).toHaveBeenCalledWith({ data: expect.objectContaining({ id: 5 }), message: 'success' });
  });

  it('never forwards client-supplied id or municipalityId to prisma', async () => {
    update.mockResolvedValue({ id: 5 });

    await new FeatureFlagController().updateFeatureFlag(req, 2281, 5, { id: 99, municipalityId: 1, name: 'x' } as any, makeRes());

    const { data } = update.mock.calls[0][0];
    expect('id' in data).toBe(false);
    expect('municipalityId' in data).toBe(false);
  });
});
