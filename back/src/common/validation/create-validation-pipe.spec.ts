import { type ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { IsEmail, IsInt, IsString, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { createValidationPipe } from './create-validation-pipe';

class SampleBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class SampleQueryDto {
  @Type(() => Number)
  @IsInt()
  @Max(100)
  limit!: number;
}

const body: ArgumentMetadata = { type: 'body', metatype: SampleBodyDto, data: '' };
const query: ArgumentMetadata = { type: 'query', metatype: SampleQueryDto, data: '' };

describe('createValidationPipe', () => {
  const pipe = createValidationPipe();

  it('returns an instance of the DTO class for valid input', async () => {
    const result: unknown = await pipe.transform(
      { email: 'user@example.com', password: 'correct-horse' },
      body,
    );

    expect(result).toBeInstanceOf(SampleBodyDto);
    expect(result).toEqual({ email: 'user@example.com', password: 'correct-horse' });
  });

  it('converts a query string value with an explicit type', async () => {
    const result: unknown = await pipe.transform({ limit: '20' }, query);

    expect(result).toEqual({ limit: 20 });
  });

  it('rejects a property that the DTO does not declare', async () => {
    await expect(
      pipe.transform({ email: 'user@example.com', password: 'correct-horse', role: 'admin' }, body),
    ).rejects.toMatchObject({
      response: { message: ['property role should not exist'] },
    });
  });

  it('lists every invalid field', async () => {
    await expect(
      pipe.transform({ email: 'not-an-email', password: 'short' }, body),
    ).rejects.toThrow(BadRequestException);
    await expect(
      pipe.transform({ email: 'not-an-email', password: 'short' }, body),
    ).rejects.toMatchObject({
      response: {
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
      },
    });
  });

  it('rejects a query value above the maximum', async () => {
    await expect(pipe.transform({ limit: '500' }, query)).rejects.toMatchObject({
      response: { message: ['limit must not be greater than 100'] },
    });
  });
});
