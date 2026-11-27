import twilio from 'twilio';

/**
 * smsService.ts
 * 
 * Uses Twilio to send SMS messages if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are provided.
 * Falls back to console logging (mock) if credentials are not configured.
 */

export async function sendSmsReceipt(mobileNumber: string, orderId: string): Promise<void> {
  const invoiceLink = `http://localhost:3000/invoice/${orderId}`;
  const messageBody = `Thanks for your order at DARVK! View your official receipt and invoice here: ${invoiceLink}`;
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && twilioPhoneNumber) {
    try {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: mobileNumber,
      });
      console.log(`[SMS SERVICE] Successfully sent SMS to ${mobileNumber}. SID: ${message.sid}`);
      return;
    } catch (error) {
      console.error('[SMS SERVICE ERROR] Failed to send SMS via Twilio:', error);
      // Fallback to mock logging on error
    }
  }
  
  // Mock fallback
  console.log('\n==================================================');
  console.log('📲 [SMS SERVICE MOCK]');
  console.log(`Sending to: ${mobileNumber}`);
  console.log(`Message: ${messageBody}`);
  console.log('==================================================\n');
}
