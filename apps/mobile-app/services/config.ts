const DEV_API_URL = 'http://localhost:3000';
const PROD_API_URL = 'https://api.bake.ilia.to';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
export const WS_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
