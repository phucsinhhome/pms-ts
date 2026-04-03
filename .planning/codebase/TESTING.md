# Testing Strategies - pms-ts

This document defines the testing frameworks, types of tests, and procedures for verifying the pms-ts project.

## 1. Test Frameworks

### 1.1 Jest
- Used as the primary test runner.
- Integrated via `react-app-rewired` for standard React testing logic.

### 1.2 React Testing Library (RTL)
- Used for component-level testing.
- Encourages testing components in a way that resembles user behavior.

### 1.3 Testing Utilities
- `@testing-library/jest-dom`: Custom matchers for Jest.
- `@testing-library/user-event`: Advanced event firing utilities.

## 2. Test Types

### 2.1 Unit Tests
- Targeted at utility functions in `src/Service/` or data transformations in `src/db/`.
- File naming: `*.test.ts` or `*.test.tsx`.

### 2.2 Component Tests
- Focus on rendering and user interaction within individual components in `src/Components/`.
- Mocking is recommended for external API calls using Jest mocks.

### 2.3 End-to-End (E2E) Tests
- Currently, there is no E2E testing framework (like Cypress or Playwright) configured in the codebase.
- Manual verification is performed in the `development` and `production` environments.

## 3. How to Run Tests

- **Run all tests**: `npm test` or `npm run test`
- **Run tests in watch mode**: `npm test -- --watch`
- **Generate coverage report**: `npm test -- --coverage`

## 4. Testing Guidelines

### 4.1 Mocking Strategy
- API calls from `src/db/` should be mocked in component tests.
- Avoid using real API endpoints during automated testing to maintain reliability.

### 4.2 Coverage Goals
- Focus on critical domain logic (e.g., `InvoiceEditor`, `Inventory`, `ReservationManager`).
- Utility functions in `src/Service/Utils.ts` should have near 100% coverage.

### 4.3 Adding New Tests
- New features should be accompanied by at least one test file verifying core functionality.
- Tests should be placed in the same directory as the file being tested (or in a `__tests__` subdirectory if many).

## 5. Continuous Integration (CI)
- Tests are expected to run during the build process defined in standard CI/CD pipelines (not explicitly defined in the local repository structure).
