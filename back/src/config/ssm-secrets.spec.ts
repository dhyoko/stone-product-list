import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { InvalidConfigError } from './invalid-config.error';
import { loadJwtSecretFromSsm } from './ssm-secrets';

const ssm = mockClient(SSMClient);
const PARAMETER = '/product-api/jwt-secret';
const SECRET = 'a-secret-from-ssm-that-is-at-least-32-characters';

describe('loadJwtSecretFromSsm', () => {
  beforeEach(() => {
    ssm.reset();
  });

  it('copies the decrypted parameter into JWT_SECRET', async () => {
    ssm.on(GetParameterCommand).resolves({ Parameter: { Value: SECRET } });
    const env: NodeJS.ProcessEnv = { JWT_SECRET_SSM_PARAMETER: PARAMETER };

    await loadJwtSecretFromSsm({ env, client: new SSMClient({}) });

    expect(env.JWT_SECRET).toBe(SECRET);
    expect(ssm.commandCalls(GetParameterCommand)[0]?.args[0].input).toEqual({
      Name: PARAMETER,
      WithDecryption: true,
    });
  });

  it('does nothing when no parameter name is set', async () => {
    const env: NodeJS.ProcessEnv = {};

    await loadJwtSecretFromSsm({ env, client: new SSMClient({}) });

    expect(env.JWT_SECRET).toBeUndefined();
    expect(ssm.calls()).toHaveLength(0);
  });

  it('keeps a JWT_SECRET that is already set', async () => {
    const env: NodeJS.ProcessEnv = { JWT_SECRET_SSM_PARAMETER: PARAMETER, JWT_SECRET: 'local' };

    await loadJwtSecretFromSsm({ env, client: new SSMClient({}) });

    expect(env.JWT_SECRET).toBe('local');
    expect(ssm.calls()).toHaveLength(0);
  });

  it('rejects a parameter that has no value', async () => {
    ssm.on(GetParameterCommand).resolves({ Parameter: {} });
    const env: NodeJS.ProcessEnv = { JWT_SECRET_SSM_PARAMETER: PARAMETER };

    await expect(loadJwtSecretFromSsm({ env, client: new SSMClient({}) })).rejects.toThrow(
      InvalidConfigError,
    );
  });
});
