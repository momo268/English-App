import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import type { TokenPayload, RefreshTokenPayload, Token } from "@en/common/user"

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    generateToken(payload: TokenPayload): Token {
        // sign 创建token
        // 创建两个token accessToken 验证的token 过期时间很快
        // refreshToken 刷新的token 过期时间长
        // 提供刷新token的接口 refreshToken->accessToken
        return {
            accessToken: this.jwtService.sign<RefreshTokenPayload>({ ...payload, tokenType: 'access' }), //访问令牌
            refreshToken: this.jwtService.sign<RefreshTokenPayload>({ ...payload, tokenType: 'refresh' }, { expiresIn: '7d' }), //刷新令牌通常时间会长一点
        }
    }
}
