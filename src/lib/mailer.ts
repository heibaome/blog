import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: (Number(process.env.SMTP_PORT) || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface VerificationEmailOptions {
  to: string;
  code: string;
  ip?: string;
}

export async function sendVerificationEmail(opts: VerificationEmailOptions): Promise<void> {
  const { to, code, ip } = opts;

  const infoLine = ip
    ? `<p style="color:#888;font-size:13px;margin:4px 0;">请求来源 IP：${ip}</p>`
    : "";

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Moji Blog - 邮箱验证码",
    html: `
      <div style="max-width:480px;margin:0 auto;padding:24px;font-family:sans-serif;color:#333;">
        <h2 style="margin:0 0 16px;">邮箱验证码</h2>
        <p>您好，您正在 Moji Blog 提交评论，验证码为：</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0;">
          ${code}
        </div>
        <p style="color:#888;font-size:13px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
        ${infoLine}
        <p style="color:#888;font-size:13px;">如果这不是您的操作，请忽略此邮件。</p>
      </div>
    `,
  });
}
