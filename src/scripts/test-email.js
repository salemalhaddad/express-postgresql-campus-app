// Test script for email functionality
const emailService = require('../services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Test basic email sending
  try {
    const testBookingData = {
      user: {
        first_name: 'Test',
        last_name: 'User',
        email: 'delivered@resend.dev' // Resend test email that accepts delivery
      },
      booking: {
        bookingId: 'test-123-456',
        startTime: new Date('2025-07-01T10:00:00Z'),
        endTime: new Date('2025-07-01T11:00:00Z'),
        purpose: 'Test booking for email service',
        notes: 'This is a test booking to verify email functionality',
        status: 'CONFIRMED',
        createdAt: new Date()
      },
      room: {
        roomNumber: '101',
        name: 'Test Room',
        type: 'STUDY_ROOM'
      },
      building: {
        name: 'Test Building',
        code: 'TST'
      }
    };

    console.log('📧 Testing booking confirmation email...');
    const result = await emailService.sendBookingConfirmation(testBookingData);
    
    console.log('✅ Email sent successfully!');
    console.log('Provider:', result.provider);
    console.log('Message ID:', result.messageId);
    console.log('Success:', result.success);

    if (result.provider === 'resend') {
      console.log('\n🎉 Resend is configured and working!');
    } else if (result.provider === 'smtp') {
      console.log('\n📮 SMTP is configured and working!');
    } else {
      console.log('\n📝 Email was logged (no provider configured)');
      console.log('To configure Resend:');
      console.log('1. Sign up at https://resend.com');
      console.log('2. Get your API key');
      console.log('3. Add RESEND_API_KEY=your-key-here to .env');
      console.log('4. Add MAIL_FROM=your-domain@yourdomain.com to .env');
    }

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testEmailService()
    .then(() => {
      console.log('\n🏁 Email test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailService };