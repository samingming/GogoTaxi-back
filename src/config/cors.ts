import { ENV } from './env';

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'https://gogo-taxi-front.vercel.app',
  'https://samingming.github.io',
  'https://ansangah.github.io'
];

const vercelFrontendPattern = /^https:\/\/gogo-taxi-front(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export function allowedOrigins() {
  return [
    ...defaultAllowedOrigins,
    ...ENV.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  ];
}

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  return allowedOrigins().includes(origin) || vercelFrontendPattern.test(origin);
}
