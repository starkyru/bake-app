export default {
  displayName: 'react-libs',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'libs/react/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  rootDir: '../..',
  roots: ['<rootDir>/libs/react'],
  testMatch: ['<rootDir>/libs/react/**/*.spec.ts', '<rootDir>/libs/react/**/*.spec.tsx'],
  moduleNameMapper: {
    '@bake-app/shared-types': '<rootDir>/libs/shared-types/src',
    '@bake-app/react/auth': '<rootDir>/libs/react/auth/src/index.ts',
    '@bake-app/react/api-client': '<rootDir>/libs/react/api-client/src/index.ts',
    '@bake-app/react/store': '<rootDir>/libs/react/store/src/index.ts',
    '@bake-app/react/ui': '<rootDir>/libs/react/ui/src/index.ts',
    '@bake-app/react/customer-auth': '<rootDir>/libs/react/customer-auth/src/index.ts',
  },
};
