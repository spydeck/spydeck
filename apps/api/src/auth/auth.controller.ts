import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, UpdateProfileDto } from './auth.dto';
import { Public } from './public.decorator';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );
    const token = this.authService.signToken(user);
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE_MS,
    });
    return { id: user.id, username: user.username };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.authService.getUserById(userId);
  }

  @Post('update-profile')
  @HttpCode(200)
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.authService.updateProfile(userId, dto);
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
