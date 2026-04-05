export {
  CustomerAuthProvider,
  useCustomerAuth,
} from './customer-auth-context';
export type { CustomerUser, CustomerAuthContextType } from './customer-auth-context';

export { CustomerProtectedRoute } from './customer-protected-route';

export {
  customerApiClient,
  getCustomerToken,
  setCustomerToken,
  removeCustomerToken,
  CUSTOMER_TOKEN_KEY,
} from './customer-api-client';

export {
  decodeCustomerToken,
  isCustomerTokenExpired,
} from './customer-token-utils';
