import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EmailService implements OnModuleInit {
    private transporter: nodemailer.Transporter | null = null;
    constructor(private readonly config: ConfigService) { }
    onModuleInit() {
        this.transporter = nodemailer.createTransport({
            host: this.config.get('EMAIL_HOST'),
            port: this.config.get('EMAIL_PORT'),
            secure: !!Number(this.config.get('EMAIL_USE_SSL')),
            auth: {
                user: this.config.get('EMAIL_USER'),
                pass: this.config.get('EMAIL_PASSWORD'),
            },
        });
    }

    /**
  * 
  * @param to 发送给谁
  * @param subject 标题
  * @param text 内容
  */
    async sendEmail(to: string, subject: string, text: string) {
        try {
            await this.transporter?.sendMail({
                from: this.config.get<string>('EMAIL_FROM'),
                to,
                subject,
                html: text,
            })
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}
