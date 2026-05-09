import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed },
      select: { id: true, email: true, name: true, role: true },
    });

    return { user: { ...user, role: user.role.toLowerCase() }, token: this.signToken(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...safe } = user;
    return { user: { ...safe, role: safe.role.toLowerCase() }, token: this.signToken(user.id, user.email) };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to not leak whether email exists
    if (!user) return { message: 'If this email exists, a reset link has been sent.' };

    // Expire any existing tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] ?? 'https://greenranger.kz';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    // Use verified sender — fall back to Resend's onboarding address until domain is verified
    const from = process.env.RESEND_FROM ?? 'GreenRanger — Astana <onboarding@resend.dev>';
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: 'GreenRanger — Astana: сброс пароля',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff">
          <!-- Logo -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <div style="width:32px;height:32px;border-radius:8px;background:#1a2e1a;display:inline-flex;align-items:center;justify-content:center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ec4b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <span style="font-weight:700;font-size:17px;color:#1a2e1a;letter-spacing:-0.3px">GreenRanger — Astana</span>
          </div>
          <h2 style="color:#1a2e1a;margin:0 0 8px;font-size:20px">Сброс пароля</h2>
          <p style="color:#555;margin-bottom:24px;line-height:1.6">Вы запросили сброс пароля для вашего аккаунта GreenRanger.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#2ec4b6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
            Сбросить пароль
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:28px;line-height:1.6">Ссылка действительна 1 час.<br>Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
        </div>
      `,
    });
    if (error) {
      // Log but don't expose error details to the client
      console.error('[Resend] Failed to send reset email:', error);
    }

    return { message: 'If this email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    return { message: 'Password updated successfully' };
  }

  private signToken(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email });
  }
}
