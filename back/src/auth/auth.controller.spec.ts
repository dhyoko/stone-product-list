import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { InvalidCredentialsError } from './invalid-credentials.error';

describe('AuthController', () => {
  const authService = { login: jest.fn() };

  let controller: AuthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  describe('login', () => {
    const body = plainToInstance(LoginDto, { email: 'ana@example.com', password: 'ana-password' });

    it('returns the token as a bearer token with its lifetime', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'signed.jwt.value',
        expiresInSeconds: 900,
      });

      await expect(controller.login(body)).resolves.toEqual({
        accessToken: 'signed.jwt.value',
        tokenType: 'Bearer',
        expiresIn: 900,
      });
      expect(authService.login).toHaveBeenCalledWith(body);
    });

    it('lets InvalidCredentialsError reach the exception filter', async () => {
      authService.login.mockRejectedValue(new InvalidCredentialsError());

      await expect(controller.login(body)).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
