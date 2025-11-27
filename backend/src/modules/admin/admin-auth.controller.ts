import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-auth.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('admin-auth')
@Controller('v1/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() loginDto: AdminLoginDto, @Ip() ip: string) {
    const admin = await this.adminAuthService.validateAdmin(
      loginDto.email,
      loginDto.password,
    );

    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Log admin login attempt
    console.log(`Admin login: ${admin.email} from IP: ${ip}`);

    return this.adminAuthService.login(admin);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  async logout(@Body() body: { token: string }) {
    // TODO: Implement token blacklist if needed
    return { message: 'Logged out successfully' };
  }
}
