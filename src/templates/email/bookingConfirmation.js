// Optimized email template for Resend
// Can be used with React Email or as HTML string

function generateBookingConfirmationEmail(bookingData) {
  const { user, booking, room, building } = bookingData;
  
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const duration = Math.round((endTime - startTime) / (1000 * 60 * 60 * 100)) / 100;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1f2937; }
    .intro { font-size: 16px; color: #6b7280; margin-bottom: 30px; line-height: 1.5; }
    .booking-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .booking-card h3 { color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .detail-grid { display: grid; gap: 12px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: #6b7280; font-size: 14px; }
    .detail-value { font-weight: 600; color: #1f2937; font-size: 14px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.confirmed { background: #d1fae5; color: #065f46; }
    .important-info { background: #fef9e7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .important-info h4 { color: #92400e; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center; }
    .important-info ul { margin-left: 20px; color: #78350f; }
    .important-info li { margin-bottom: 8px; font-size: 14px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
    .footer .small { font-size: 12px; color: #9ca3af; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0; }
    @media (max-width: 600px) {
      .container { margin: 0; }
      .header, .content, .footer { padding: 20px; }
      .detail-row { flex-direction: column; align-items: flex-start; }
      .detail-value { margin-top: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ Booking Confirmed</h1>
      <p>Your facility reservation is ${booking.status.toLowerCase()}</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${user.first_name} ${user.last_name},</div>
      
      <p class="intro">
        Great news! Your facility booking has been successfully ${booking.status.toLowerCase()}. 
        Here are all the details you need for your upcoming reservation.
      </p>
      
      <div class="booking-card">
        <h3>📅 Booking Details</h3>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Booking ID</span>
            <span class="detail-value">${booking.bookingId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">
              <span class="status ${booking.status.toLowerCase()}">${booking.status}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Facility</span>
            <span class="detail-value">${building.name} - ${room.name || room.roomNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Room Type</span>
            <span class="detail-value">${room.type.replace('_', ' ')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${startTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${startTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit'
            })} - ${endTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit'
            })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration</span>
            <span class="detail-value">${duration} hour${duration !== 1 ? 's' : ''}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Purpose</span>
            <span class="detail-value">${booking.purpose}</span>
          </div>
          ${booking.notes ? `
          <div class="detail-row">
            <span class="detail-label">Notes</span>
            <span class="detail-value">${booking.notes}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="important-info">
        <h4>📋 Important Reminders</h4>
        <ul>
          <li><strong>Arrive on time</strong> - Late arrivals may result in booking cancellation</li>
          <li><strong>Bring valid ID</strong> for facility access verification</li>
          <li><strong>Follow facility guidelines</strong> and leave the space clean</li>
          <li><strong>Cancel in advance</strong> if plans change to avoid penalties</li>
          <li><strong>Contact facilities</strong> if you need assistance or have questions</li>
        </ul>
      </div>

      ${booking.status === 'PENDING' ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #92400e; font-weight: 500; margin: 0;">
          ⏳ <strong>Pending Approval:</strong> Your booking is awaiting confirmation. 
          You'll receive another email once it's approved.
        </p>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Questions? Contact the Facilities Office</p>
      <p>📧 facilities@campus.edu | 📞 (555) 123-4567</p>
      <p class="small">
        This is an automated message from the Campus Facility Booking System.<br>
        Booking created on ${new Date(booking.createdAt).toLocaleString()}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateBookingCancellationEmail(bookingData) {
  const { user, booking, room, building } = bookingData;
  
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .content { padding: 40px 30px; }
    .booking-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; color: #6b7280; }
    .detail-value { font-weight: 600; color: #1f2937; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Booking Cancelled</h1>
      <p>Your facility reservation has been cancelled</p>
    </div>
    
    <div class="content">
      <h2>Hello ${user.first_name} ${user.last_name},</h2>
      <p style="margin: 20px 0; color: #6b7280;">Your facility booking has been cancelled. Here are the details:</p>
      
      <div class="booking-card">
        <h3 style="margin-bottom: 16px;">Cancelled Booking</h3>
        <div class="detail-row">
          <span class="detail-label">Booking ID</span>
          <span class="detail-value">${booking.bookingId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Facility</span>
          <span class="detail-value">${building.name} - ${room.name || room.roomNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${startTime.toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}</span>
        </div>
      </div>

      <p style="color: #6b7280;">Need to book another facility? Visit our booking system anytime.</p>
    </div>
    
    <div class="footer">
      <p>Campus Facility Booking System</p>
      <p>This is an automated message.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  generateBookingConfirmationEmail,
  generateBookingCancellationEmail
};