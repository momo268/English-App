import { Body, Injectable, Post } from '@nestjs/common';
import { PrismaService, ResponseService } from '@libs/shared';
import type { UserLogin, UserRegister, Token, RefreshTokenPayload, UserUpdate } from '@en/common/user';
import type { Prisma } from '@libs/shared/generated/prisma/client';
import { AuthService } from '../auth/auth.service'
import { JwtService } from '@nestjs/jwt'
import { MinioService } from '@libs/shared/minio/minio.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { userSelect, updateUserSelect } from './user.select';


@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService
  ) { }

  // 登录
  async login(createUserDto: UserLogin) {
    // phone password
    // 1.检查手机号是否存在
    const user = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });
    if (!user) {
      return this.response.error('用户不存在');
    }

    // 2.检查密码是否正确
    if (user.password !== createUserDto.password) {
      return this.response.error('密码错误');
    }

    // 3.查询用户信息 更新最后登录时间
    const updateUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: userSelect
    });

    // 4.生成token
    const token = this.authService.generateToken({
      userId: updateUser.id,
      name: updateUser.name,
      email: updateUser.email,
    });

    return this.response.success({ ...updateUser, token })
  }

  // 注册
  async register(createUserDto: UserRegister) {
    // name email? phone password
    const data: Prisma.UserCreateInput = {
      name: createUserDto.name,
      phone: createUserDto.phone,
      password: createUserDto.password,
      lastLoginAt: new Date(),
    }
    // 1.如果手机号已经存在返回错误
    const user = await this.prisma.user.findUnique({
      where: {
        phone: createUserDto.phone,
      },
    });
    if (user) {
      return this.response.error('手机号已经存在');
    }

    // 2. 判断邮箱，如果传了并且存在返回错误
    if (createUserDto.email) {
      const user = await this.prisma.user.findUnique({
        where: {
          email: createUserDto.email,
        },
      });
      if (user) {
        return this.response.error('邮箱已经存在');
      }
      data.email = createUserDto.email;
    }

    // 3. 创建用户 默认是把所有值都返回，包括密码 排除掉密码
    const newUser = await this.prisma.user.create({
      data,
      select: userSelect
    });

    // 4.生成token
    const token = this.authService.generateToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });

    return this.response.success({ ...newUser, token }, '注册成功')
  }

  // 刷新token
  async refreshToken(refreshTokenDto: Omit<Token, 'accessToken'>) {
    // 1. 验证refreshToken是否有效
    try {
      const decoded = this.jwtService.verify<RefreshTokenPayload>(refreshTokenDto.refreshToken);
      if (decoded.tokenType !== 'refresh') {
        return this.response.error('无效的刷新令牌', null);
      }
      //2. 查询用户信息分辨是否伪造payload
      const user = await this.prisma.user.findUnique({
        where: {
          id: decoded.userId, //查询用户ID
        }
      })
      if (!user) {
        return this.response.error('用户不存在', null);
      }

      const token = this.authService.generateToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      return this.response.success(token);
    } catch (error) {
      return this.response.error('token已过期或无效', null)
    }

  }

  // 上传头像
  async uploadAvatar(file: Express.Multer.File) {
    if (!file) {
      return this.response.error('文件不存在')
    }
    if (file.size > 1024 * 1024 * 10) {
      return this.response.error('文件大小不能超过10MB')
    }
    try {
      // 获取minio客户端
      const client = this.minioService.getClient();
      // 获取bucket
      const bucket = this.minioService.getBucket()!;
      // 上传资源到minio
      const fileName = `${Date.now()}-${file.originalname}`;
      await client.putObject(bucket, fileName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      // 返回文件url
      const isHttps = !!Number(this.configService.get<boolean>('MINIO_USE_SSL')); //是否开启SSL
      const baseUrl = isHttps ? 'https' : 'http';
      const port = this.configService.get<string>('MINIO_PORT')!;
      const dataBaseUrl = `/${bucket}/${fileName}`
      const preViewUrl = `${baseUrl}://${this.configService.get<string>('MINIO_ENDPOINT')!}:${port}${dataBaseUrl}`;
      return this.response.success({
        preViewUrl,
        dataBaseUrl
      })
    } catch (error) {
      return this.response.error('上传失败，请稍后重试')
    }

  }

  //更新用户信息
  async updateUser(createUserDto: UserUpdate, user: Request['user']) {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.userId,
      },
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        address: createUserDto.address,
        avatar: createUserDto.avatar,
        bio: createUserDto.bio,
        isTimingTask: createUserDto.isTimingTask,
        timingTaskTime: createUserDto.timingTaskTime,
      },
      select: updateUserSelect
    });
    return this.response.success(updatedUser);
  }
}
