module.exports = {
  displayName: 'api',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'apps/api/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  rootDir: '../..',
  roots: ['<rootDir>/apps/api'],
  testMatch: ['<rootDir>/apps/api/**/*.spec.ts'],
  moduleNameMapper: {
    '@bake-app/shared-types': '<rootDir>/libs/shared-types/src',
  },
};
