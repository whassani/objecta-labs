module.exports = {
  displayName: 'Workflow Integration Tests',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 300000, // 5 minutes for LLM tests
  setupFilesAfterEnv: ['./jest.setup.ts'],
  collectCoverageFrom: [
    '../../src/modules/workflows/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
  ],
  coverageDirectory: '../../coverage/workflows',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  bail: false, // Continue running tests even if some fail
};
