const isProd = import.meta.env.PROD;

export const env = {
  production: isProd,
  posUrl: isProd ? 'https://pos.bake.ilia.to' : 'http://localhost:4200',
  adminUrl: isProd ? 'https://admin.bake.ilia.to' : 'http://localhost:4201',
  kitchenUrl: isProd ? 'https://kitchen.bake.ilia.to' : 'http://localhost:4202',
};
