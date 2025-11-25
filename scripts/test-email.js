import nodemailer from 'nodemailer';
import 'dotenv/config';

const sendTestEmail = async () => {
  console.log('🚀 Starting Email Service Test...\n');

  // Check for required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_SERVICE) {
    console.error('❌ Missing email configuration in .env');
    console.error('   Please ensure EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD are set.');
    process.exit(1);
  }

  console.log(`📧 Configured Service: ${process.env.EMAIL_SERVICE}`);
  console.log(`📧 Sending from: ${process.env.EMAIL_USER}`);

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('✅ Server is ready to take our messages');

    // Send test email
    const info = await transporter.sendMail({
      from: `"AfroLuxe Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "AfroLuxe Email Service Test",
      text: "If you are reading this, your email service is configured correctly! 🚀",
      html: "<b>If you are reading this, your email service is configured correctly! 🚀</b>",
    });

    console.log('✅ Message sent: %s', info.messageId);
    console.log('✨ Email test completed successfully! Check your inbox.');

  } catch (error) {
    console.error('❌ Email Test Failed');
    console.error('   Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   Hint: Check your email and password. If using Gmail, you might need an App Password.');
    }
  }
};

sendTestEmail();
