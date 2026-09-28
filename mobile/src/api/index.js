import { request } from './client';

const enc = encodeURIComponent;

export const api = {
  demoUsers: () => request('/auth/demo-users'),
  demoLogin: (userId) => request('/auth/demo-login', { method: 'POST', body: { userId } }),

  listCompetitions: () => request('/competitions'),
  competition: (slug, opts) => request(`/competitions/${enc(slug)}`, opts),
  viewer: (slug, opts) => request(`/competitions/${enc(slug)}/viewer`, opts),
  availability: (slug) => request(`/competitions/${enc(slug)}/availability`),

  register: (slug) => request(`/competitions/${enc(slug)}/registrations`, { method: 'POST' }),
  cancelRegistration: (id) => request(`/registrations/${enc(id)}`, { method: 'DELETE' }),
  simulateCheckout: (id) => request(`/registrations/${enc(id)}/payment/simulate`, { method: 'POST' }),
  confirmPayment: (id, payment) => request(`/registrations/${enc(id)}/payment/confirm`, { method: 'POST', body: payment }),

  uploadSubmission: (slug, formData) =>
    request(`/competitions/${enc(slug)}/submission`, { method: 'PUT', formData, timeoutMs: 10 * 60_000 }),

  testimonials: () => request('/testimonials'),
};

export { ApiError, setAuthToken, setApiLanguage } from './client';
