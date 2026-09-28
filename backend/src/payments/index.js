const crypto = require('crypto');
const config = require('../config');

const mockGateway = {
  name: 'mock',

  async createOrder({ amount, currency, receipt }) {
    return { orderId: `order_mock_${crypto.randomBytes(8).toString('hex')}`, amount, currency, receipt };
  },

  sign(orderId, paymentId) {
    return crypto.createHmac('sha256', config.jwtSecret).update(`${orderId}|${paymentId}`).digest('hex');
  },

  async verifyPayment({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) return false;
    const expected = Buffer.from(this.sign(orderId, paymentId));
    const received = Buffer.from(String(signature));
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  },

  async simulateCheckout({ orderId }) {
    const paymentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
    return { orderId, paymentId, signature: this.sign(orderId, paymentId) };
  },
};

const gateways = { mock: mockGateway };

function getGateway() {
  const gateway = gateways[config.paymentProvider];
  if (!gateway) throw new Error(`Unsupported PAYMENT_PROVIDER "${config.paymentProvider}"`);
  return gateway;
}

module.exports = { getGateway };
