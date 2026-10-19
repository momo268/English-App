import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import type { RefreshTokenPayload } from '@en/common/user';

// 守卫 用户保护路由
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;
    if (!headers.authorization) {
      throw new UnauthorizedException('请先登录');
    }
    const token = headers.authorization.split(' ')[1];
    try {
      const decoed = this.jwtService.verify<RefreshTokenPayload>(token);
      if (decoed.tokenType != "access") {
        throw new UnauthorizedException('token过期或无效');
      }
      request.user = decoed;
      return true;
    } catch (error) {
      throw new UnauthorizedException('token过期或无效');
    }
  }
} 
