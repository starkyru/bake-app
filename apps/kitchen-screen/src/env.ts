const isProd = import.meta.env.PROD;

export const env = {
  production: isProd,
  wsUrl: isProd ? '' : 'http://localhost:3000',
};
