const { Router } = require('express');
const Testimonial = require('../models/Testimonial');
const { resolveLang, t } = require('../utils/localize');
const { send } = require('../utils/respond');

const router = Router();

router.get('/', async (req, res) => {
  const lang = resolveLang(req);
  const docs = await Testimonial.find({ published: true }).sort({ createdAt: -1 }).limit(20).lean();
  res.set('Cache-Control', 'public, max-age=300');
  send(
    res,
    docs.map((d) => ({ id: String(d._id), name: d.name, avatarUrl: d.avatarUrl, quote: t(d.quote, lang), rating: d.rating })),
  );
});

module.exports = router;
