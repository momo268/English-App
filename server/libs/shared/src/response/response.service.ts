import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
    success(data?: any, message?: string, code?: number) {
        return {
            code: code ?? 1,
            message: message ?? "请求成功",
            success: true,
            data: data ?? null,
        }
    }
    error(data = null, message: string, code: number) {
        return {
            code: code || 0,
            message: message || "请求失败",
            success: false,
            data,
        }
    }
}
