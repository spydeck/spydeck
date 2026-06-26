import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { users } from '../db/schema';
import type { User } from '../db/schema';
import { UpdateProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB) private readonly db: DrizzleDB,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      this.logger.warn(`failed login attempt for username "${username}"`);
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  signToken(user: Pick<User, 'id' | 'username'>): string {
    return this.jwt.sign({ sub: user.id, username: user.username });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    this.logger.log(`password changed for user ${userId}`);
    return { ok: true };
  }

  async getUserById(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ ok: true }> {
    await this.db
      .update(users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    this.logger.log(`profile updated for user ${userId}`);
    return { ok: true };
  }
}
