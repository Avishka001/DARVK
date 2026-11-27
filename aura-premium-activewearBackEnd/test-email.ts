import { sendInvoiceEmail } from './emailService.ts';
import dotenv from 'dotenv';
dotenv.config();
const testOrder = {
  id: 'TEST-123',
  items: [],
  customerInfo: {
    email: 'darvkclothing@gmail.com',
    firstName: 'Test', lastName: 'User', address: '123 Test St', city: 'Test City', postalCode: '12345', country: 'US'
  },
  subtotal: 100, shipping: 0, total: 100, paymentMethod: 'card', date: new Date().toISOString()
};
sendInvoiceEmail(testOrder as any).then(() => console.log('Done')).catch(e => console.error(e));
