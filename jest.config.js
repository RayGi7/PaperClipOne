/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node' } }],
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s', '**/*.test.[jt]s'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

module.exports = config;
