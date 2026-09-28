const { Schema, model } = require('mongoose');
const { LocalizedString, httpUrl } = require('./shared');

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    avatarUrl: { type: String, validate: httpUrl },
    quote: { type: LocalizedString, required: true },
    rating: { type: Number, min: 1, max: 5 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TestimonialSchema.index({ published: 1, createdAt: -1 });

module.exports = model('Testimonial', TestimonialSchema);
