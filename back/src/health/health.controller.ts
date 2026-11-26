import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/auth/public.decorator';
import { HealthResponseDto } from './health-response.dto';

@Public()
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Report that the API is running' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return new HealthResponseDto();
  }
}
