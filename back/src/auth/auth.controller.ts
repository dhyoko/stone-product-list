import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../common/auth/authenticated-request';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Public } from '../common/auth/public.decorator';
import { ErrorResponseDto } from '../common/errors/error-response.dto';
import { ApiRateLimitedResponse } from '../rate-limit/api-rate-limited-response.decorator';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password to get an access token' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'The body is not valid' })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'The email or password is wrong',
  })
  @ApiRateLimitedResponse()
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return new LoginResponseDto(await this.authService.login(body));
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the user that the access token belongs to' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'The access token is missing, expired, or not valid',
  })
  @ApiRateLimitedResponse()
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return new UserResponseDto(await this.authService.getCurrentUser(user.id));
  }
}
