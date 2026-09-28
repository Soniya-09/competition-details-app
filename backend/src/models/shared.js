const { Schema } = require('mongoose');

const LocalizedString = new Schema(
  {
    en: { type: String, required: true, trim: true },
    hi: { type: String, trim: true },
  },
  { _id: false },
);

const httpUrl = {
  validator: (v) => v == null || /^https?:\/\//i.test(v),
  message: 'must be an http(s) URL',
};

module.exports = { LocalizedString, httpUrl };
