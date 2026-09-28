const { Router } = require('express');
const config = require('../config');
const Registration = require('../models/Registration');
const registrationService = require('../services/registrationService');
const competitionService = require('../services/competitionService');
const { getGateway } = require('../payments');
const { requireAuth } = require('../middleware/auth');
const { validate, objectId, z } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimits');
const { notFound, forbidden } = require('../utils/errors');
const { send } = require('../utils/respond');

const router = Router();
const params = validate({ params: z.object({ id: objectId }) });

router.use(requireAuth, writeLimiter);

async function respondWithViewer(res, registration) {
  const viewer = await competitionService.getViewerState(registration.competition, registration.user);
  send(res, { registration: competitionService.toRegistrationDto(registration), viewer });
}

router.post(
  '/:id/payment/confirm',
  params,
  validate({
    body: z.object({
      orderId: z.string().min(1).max(100),
      paymentId: z.string().min(1).max(100),
      signature: z.string().min(1).max(200),
    }),
  }),
  async (req, res) => {
    const registration = await registrationService.confirmPayment({
      registrationId: req.valid.params.id,
      userId: req.user.id,
      ...req.valid.body,
    });
    await respondWithViewer(res, registration);
  },
);

router.delete('/:id', params, async (req, res) => {
  const registration = await registrationService.cancel({ registrationId: req.valid.params.id, userId: req.user.id });
  await respondWithViewer(res, registration);
});

router.post('/:id/payment/simulate', params, async (req, res) => {
  const gateway = getGateway();
  if (config.isProduction || !gateway.simulateCheckout) {
    throw forbidden('SIMULATION_DISABLED', 'Payment simulation is disabled');
  }
  const registration = await Registration.findOne({ _id: req.valid.params.id, user: req.user.id }).lean();
  if (!registration?.payment?.orderId) throw notFound('Pending payment');
  send(res, await gateway.simulateCheckout({ orderId: registration.payment.orderId }));
});

module.exports = router;
