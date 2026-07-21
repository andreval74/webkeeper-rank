import { BadRequestException } from '@nestjs/common';
import { PublicWriController } from './public-wri.controller';
import { runDeterministicAudit } from './wri-audit.util';

jest.mock('./wri-audit.util');
const mockedRunAudit = runDeterministicAudit as jest.MockedFunction<typeof runDeterministicAudit>;

describe('PublicWriController', () => {
  let controller: PublicWriController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PublicWriController();
  });

  it('roda a auditoria e devolve o resultado para um domínio válido', async () => {
    const audit = {
      domain: 'acme.com',
      score: 70,
      checks: [{ category: 'Security' as const, key: 'https', value: 1, weight: 30 }],
    };
    mockedRunAudit.mockResolvedValue(audit);

    const result = await controller.check({ domain: 'acme.com' });

    expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
    expect(result).toBe(audit);
  });

  it('rejeita domínio interno sem chamar a auditoria', async () => {
    await expect(controller.check({ domain: 'localhost' })).rejects.toThrow(BadRequestException);
    expect(mockedRunAudit).not.toHaveBeenCalled();
  });
});
