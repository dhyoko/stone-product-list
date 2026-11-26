import { GetParameterCommand, type SSMClient } from '@aws-sdk/client-ssm';
import { InvalidConfigError } from './invalid-config.error';

export async function loadJwtSecretFromSsm(input: {
  readonly env: NodeJS.ProcessEnv;
  readonly client: SSMClient;
}): Promise<void> {
  const { env, client } = input;
  const name = env.JWT_SECRET_SSM_PARAMETER;
  if (name === undefined || env.JWT_SECRET !== undefined) {
    return;
  }
  const { Parameter } = await client.send(
    new GetParameterCommand({ Name: name, WithDecryption: true }),
  );
  if (Parameter?.Value === undefined) {
    throw new InvalidConfigError(`SSM parameter ${name} has no value`);
  }
  env.JWT_SECRET = Parameter.Value;
}
