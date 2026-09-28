const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं'],
};

function groupIndian(n) {
  const [int, dec] = String(n).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (rest ? `${rest},${last3}` : last3) + (dec ? `.${dec}` : '');
}

export function formatMoney(money) {
  if (!money) return '';
  const major = money.amount / 100;
  const value = Number.isInteger(major) ? major : major.toFixed(2);
  return `₹${groupIndian(value)}`;
}

const pad = (n) => String(n).padStart(2, '0');

export function formatDay(iso, lang = 'en') {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[lang]?.[d.getMonth()] ?? MONTHS.en[d.getMonth()]} ${pad(d.getFullYear() % 100)}`;
}

export function formatTime(iso) {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${pad(h)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

export const formatDateTime = (iso, lang) => `${formatDay(iso, lang)}, ${formatTime(iso)}`;

export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function formatCountdown(ms) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  return `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
}

export function formatMmSs(ms) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  const m = days * 1440 + hours * 60 + minutes;
  return `${pad(m)}:${pad(seconds)}`;
}
