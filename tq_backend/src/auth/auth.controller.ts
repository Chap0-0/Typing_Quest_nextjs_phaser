import { Controller, Post, Body, Res, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetSession } from './decorators/session.decorator';
import { UserSession } from '../users/entities/user-session.entity';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    const tokens = await this.authService.login(user);
    
    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('sessionId', tokens.session_id, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      accessToken: tokens.access_token,
      user: tokens.user,
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );
    

    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('sessionId', tokens.session_id, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      accessToken: tokens.access_token,
      user: tokens.user,
    };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(
    @GetSession() session: UserSession,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    const tokens = await this.authService.refreshTokens(session.session_id, refreshToken);
    

    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('sessionId', tokens.session_id, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      accessToken: tokens.access_token,
      user: tokens.user,
    };
  }

  @Post('logout')
  @UseGuards(RefreshTokenGuard)
  async logout(
    @GetSession() session: UserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(session.session_id);
    
    // Очищаем куки
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');

    return { success: true };
  }


  @Get('check')
  @UseGuards(RefreshTokenGuard) // Используем guard для refreshToken
  async checkAuth(@Req() req: Request) {
    return {
      authenticated: true,
      user: req.user,
    };
  }
}