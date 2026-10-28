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

// 可选登录：无 token 时按游客放行；带了 token 但无效时必须返回 401，交给前端刷新/重新登录。
// 不能把“过期 token”当成游客，否则已购课程会重新出现在精选课程里。
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    if (!authorization) return true;
    const token = authorization.split(' ')[1];
    if (!token) throw new UnauthorizedException('token过期或无效');
    try {
      const decoded = this.jwtService.verify<RefreshTokenPayload>(token);
      if (decoded.tokenType !== 'access') {
        throw new UnauthorizedException('token过期或无效');
      }
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('token过期或无效');
    }
  }
}
