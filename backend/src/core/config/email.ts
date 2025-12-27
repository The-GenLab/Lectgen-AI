import nodemailer from 'nodemailer';

// Cấu hình email service
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASSWORD, // App password (not regular password)
  },
};

// Tạo transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

// Email từ mặc định
export const EMAIL_FROM = process.env.EMAIL_FROM || 'LectGen AI <noreply@lectgen.ai>';

// Template cho email reset password
export const getResetPasswordEmailHtml = (resetUrl: string, userName: string): string => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #4F46E5;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #4338CA;
        }
        .warning {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #718096;
            text-align: center;
        }
        .link {
            color: #4F46E5;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎓 LectGen AI</div>
        </div>
        
        <h2 class="title">Xin chào ${userName}!</h2>
        
        <div class="content">
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc sao chép và dán đường link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #4F46E5;">
                <a href="${resetUrl}" class="link">${resetUrl}</a>
            </p>
        </div>
        
        <div class="warning">
            <strong>⏰ Lưu ý quan trọng:</strong>
            <p style="margin: 8px 0 0 0;">Link này chỉ có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
        
        <div class="footer">
            <p>Nếu bạn gặp vấn đề với nút trên, hãy liên hệ với chúng tôi để được hỗ trợ.</p>
            <p style="margin-top: 10px;">
                <strong>LectGen AI Team</strong><br>
                © 2025 LectGen AI. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

// Template cho email chào mừng (optional)
export const getWelcomeEmailHtml = (userName: string): string => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chào mừng đến với LectGen AI</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4a5568;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #718096;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎉</div>
            <h2 class="title">Chào mừng ${userName} đến với LectGen AI!</h2>
        </div>
        
        <div class="content">
            <p>Cảm ơn bạn đã đăng ký tài khoản LectGen AI.</p>
            <p>Giờ đây bạn có thể bắt đầu tạo các slide bài giảng tuyệt vời với sức mạnh của AI!</p>
        </div>
        
        <div class="footer">
            <p><strong>LectGen AI Team</strong><br>
            © 2025 LectGen AI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Hàm gửi email reset password
export const sendResetPasswordEmail = async (
  to: string,
  userName: string,
  resetUrl: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: 'Đặt lại mật khẩu - LectGen AI',
      html: getResetPasswordEmailHtml(resetUrl, userName),
    });
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};

// Hàm gửi email chào mừng (optional)
export const sendWelcomeEmail = async (
  to: string,
  userName: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: 'Chào mừng đến với LectGen AI! 🎓',
      html: getWelcomeEmailHtml(userName),
    });
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};
