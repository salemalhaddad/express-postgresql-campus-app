const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.resend = null;
    this.transporter = null;
    this.isConfigured = false;
    this.emailProvider = 'none';
    this.init();
  }

  init() {
    try {
      // Try Resend first if API key is available
      if (process.env.RESEND_API_KEY) {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.isConfigured = true;
        this.emailProvider = 'resend';
        logger.info('Email service configured with Resend');
        return;
      }

      // Fallback to SMTP/Nodemailer
      if ((process.env.MAIL_HOST || process.env.SMTP_HOST) && 
          (process.env.MAIL_USER || process.env.SMTP_USER) && 
          (process.env.MAIL_PASS || process.env.SMTP_PASS)) {
        
        this.transporter = nodemailer.createTransporter({
          host: process.env.MAIL_HOST || process.env.SMTP_HOST,
          port: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587'),
          secure: process.env.MAIL_PORT === '465' || process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USER || process.env.SMTP_USER,
            pass: process.env.MAIL_PASS || process.env.SMTP_PASS
          }
        });

        // Verify SMTP connection
        this.transporter.verify((error, success) => {
          if (error) {
            logger.warn('SMTP email service not configured properly:', error.message);
            logger.info('Email notifications will be logged instead of sent');
            this.isConfigured = false;
          } else {
            logger.info('Email service configured with SMTP');
            this.isConfigured = true;
            this.emailProvider = 'smtp';
          }
        });
      } else {
        logger.warn('No email configuration found (RESEND_API_KEY or SMTP credentials)');
        logger.info('Email notifications will be logged instead of sent');
        this.isConfigured = false;
      }

    } catch (error) {
      logger.warn('Failed to initialize email service:', error.message);
      this.isConfigured = false;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    const fromEmail = process.env.MAIL_FROM || process.env.FROM_EMAIL || 'campus-system@university.edu';

    try {
      if (this.isConfigured && this.emailProvider === 'resend') {
        // Use Resend
        const { data, error } = await this.resend.emails.send({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text: text || this.htmlToText(html)
        });

        if (error) {
          throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
        }

        logger.info(`Email sent successfully via Resend to ${to}: ${data.id}`);
        return { success: true, messageId: data.id, provider: 'resend' };

      } else if (this.isConfigured && this.emailProvider === 'smtp') {
        // Use SMTP/Nodemailer
        const mailOptions = {
          from: fromEmail,
          to,
          subject,
          html,
          text: text || this.htmlToText(html)
        };

        const info = await this.transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully via SMTP to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId, provider: 'smtp' };

      } else {
        // Log email instead of sending when not configured
        logger.info('EMAIL (would be sent):', {
          to,
          subject,
          provider: 'none (logged)',
          html: html.substring(0, 200) + '...',
          text: (text || this.htmlToText(html)).substring(0, 200) + '...'
        });
        return { success: true, messageId: 'logged', provider: 'logged' };
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendBookingConfirmation(bookingData) {
    const { user, booking, room, building } = bookingData;
    const { generateBookingConfirmationEmail } = require('../templates/email/bookingConfirmation');
    
    const subject = `✅ Booking Confirmed - ${building.name} ${room.roomNumber || room.name}`;
    const html = generateBookingConfirmationEmail(bookingData);

    return await this.sendEmail(user.email, subject, html);
  }

  async sendBookingCancellation(bookingData) {
    const { user, booking, room, building } = bookingData;
    const { generateBookingCancellationEmail } = require('../templates/email/bookingConfirmation');
    
    const subject = `❌ Booking Cancelled - ${building.name} ${room.roomNumber || room.name}`;
    const html = generateBookingCancellationEmail(bookingData);

    return await this.sendEmail(user.email, subject, html);
  }

  async sendBookingReminder(bookingData) {
    const { user, booking, room, building } = bookingData;
    
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const now = new Date();
    const hoursUntil = Math.round((startTime - now) / (1000 * 60 * 60));

    const subject = `Booking Reminder - ${building.name} ${room.roomNumber} in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .booking-details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #495057; }
          .value { color: #212529; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
          .urgent { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Booking Reminder</h1>
            <p>Your facility booking starts in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.first_name} ${user.last_name},</h2>
            
            <div class="urgent">
              <strong>🕐 Don't forget:</strong> You have a facility booking coming up!
            </div>
            
            <div class="booking-details">
              <h3>Your Upcoming Booking</h3>
              <div class="detail-row">
                <span class="label">Facility:</span>
                <span class="value">${building.name} - ${room.name || room.roomNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${startTime.toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Purpose:</span>
                <span class="value">${booking.purpose}</span>
              </div>
            </div>

            <h3>Quick Reminders:</h3>
            <ul>
              <li>📍 <strong>Location:</strong> ${building.name}</li>
              <li>🆔 <strong>Bring your ID</strong> for facility access</li>
              <li>⏰ <strong>Arrive on time</strong> to avoid cancellation</li>
              <li>🧹 <strong>Leave the space clean</strong> for the next user</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated reminder from the Campus Facility Booking System.</p>
            <p>If you need to cancel or modify your booking, please contact the facilities office.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;