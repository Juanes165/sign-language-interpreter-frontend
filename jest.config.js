const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/page.js',
    '!src/**/layout.js',
    '!src/app/**/route.js',
    '!src/**/index.js', // Archivos de barril (barrel exports)
    '!src/components/**/index.js',
    '!src/lib/index.js',
    '!src/utils/index.js',
    '!src/hooks/index.js',
    '!src/config/modelConfig.js', // Archivo de configuración excluido
    '!src/hooks/useContributeCapture.js', // Hook complejo excluido del coverage
    '!src/hooks/useGestureRecognitionLSTM.js', // Hook complejo excluido del coverage
    '!src/lib/saveToBackend.js', // Funciones de backend excluidas del coverage
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

