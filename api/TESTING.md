# Testing Guide

Comprehensive testing documentation for the Gift Map API.

## 🧪 Test Structure

```
api/src/
├── test/
│   ├── setup.ts                          # Test configuration & helpers
│   └── integration/                      # Integration tests
│       └── auth.integration.test.ts
└── modules/
    ├── auth/
    │   └── auth.service.test.ts          # Unit tests
    ├── gift-ideas/
    │   └── gift-ideas.service.test.ts
    └── [other modules]/
```

## 📊 Test Types

### Unit Tests

Test individual services in isolation:
- **Location**: `src/modules/*/[module].service.test.ts`
- **Focus**: Business logic, data validation, error handling
- **Dependencies**: Mock database with test helpers
- **Example**: `auth.service.test.ts`, `gift-ideas.service.test.ts`

### Integration Tests

Test complete API workflows:
- **Location**: `src/test/integration/*.integration.test.ts`
- **Focus**: HTTP endpoints, request/response, authentication
- **Dependencies**: Real Express app with test database
- **Example**: `auth.integration.test.ts`

## 🚀 Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### With Coverage Report

```bash
npm run test:unit
```

This generates:
- Console coverage summary
- HTML report in `coverage/index.html`
- JSON data in `coverage/coverage-final.json`

## 🎯 Coverage Goals

Target: **60%+ coverage** across the codebase

Current modules with tests:
- ✅ Authentication Service (auth.service.test.ts)
- ✅ Gift Ideas Service (gift-ideas.service.test.ts)
- ✅ Auth Integration (auth.integration.test.ts)

To be added:
- Workspaces Service
- Gift Maps Service
- People Service
- Edges Service

## 📝 Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourService } from './your.service';
import { testPrisma, createTestUser } from '@/test/setup';

describe('YourService', () => {
  let service: YourService;
  let testUser: any;

  beforeEach(async () => {
    service = new YourService();
    testUser = await createTestUser({
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  describe('yourMethod', () => {
    it('should do something', async () => {
      const result = await service.yourMethod(testUser.id, {
        // test data
      });

      expect(result).toBeDefined();
      expect(result.property).toBe('expected value');
    });

    it('should throw error for invalid input', async () => {
      await expect(
        service.yourMethod('invalid-id', {})
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/app';

describe('Your API Integration Tests', () => {
  let accessToken: string;

  it('should perform action', async () => {
    const response = await request(app)
      .post('/api/v1/your-endpoint')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        field: 'value',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});
```

## 🛠️ Test Helpers

### Available Helpers (from `@/test/setup`)

#### `createTestUser(data?)`
Creates a test user with optional custom fields.

```typescript
const user = await createTestUser({
  email: 'custom@example.com',
  displayName: 'Custom Name',
  passwordHash: await hashPassword('password'),
});
```

#### `createTestWorkspace(ownerId, data?)`
Creates a test workspace with the user as owner.

```typescript
const workspace = await createTestWorkspace(user.id, {
  name: 'My Workspace',
  slug: 'my-workspace',
});
```

#### `createTestGiftMap(workspaceId, createdBy, data?)`
Creates a test gift map in a workspace.

```typescript
const giftMap = await createTestGiftMap(workspace.id, user.id, {
  title: 'Christmas 2024',
  year: 2024,
  occasion: 'christmas',
});
```

#### `createTestPerson(giftMapId, data?)`
Creates a test person in a gift map.

```typescript
const person = await createTestPerson(giftMap.id, {
  name: 'Mom',
  budgetMin: 50,
  budgetMax: 150,
});
```

#### `createTestGiftIdea(personId, createdBy, data?)`
Creates a test gift idea for a person.

```typescript
const idea = await createTestGiftIdea(person.id, user.id, {
  title: 'Gift Idea',
  price: 99.99,
  status: 'considering',
});
```

## ⚙️ Test Configuration

### Environment Variables

Tests use the test database defined in `.env.test` or fallback to:
```
DATABASE_URL=postgresql://giftmap:password@localhost:5432/gift_map_test
```

### Setup & Teardown

The test setup (`src/test/setup.ts`) automatically:
- **Before all tests**: Connect to test database
- **Before each test**: Clean all database tables
- **After all tests**: Disconnect from database

This ensures:
- Tests start with clean slate
- Tests are isolated from each other
- No test pollution

## 🐛 Debugging Tests

### Run specific test file

```bash
npx vitest run src/modules/auth/auth.service.test.ts
```

### Run specific test case

```bash
npx vitest run -t "should register a new user"
```

### Debug with logs

Tests respect the `NODE_ENV` variable. Set to development for debug logs:

```bash
NODE_ENV=development npm test
```

### Inspect database during tests

Add a breakpoint or pause in your test:

```typescript
it('should do something', async () => {
  const result = await service.doSomething();

  // Pause here and inspect database with Prisma Studio
  await new Promise(resolve => setTimeout(resolve, 60000));

  expect(result).toBeDefined();
});
```

Then run Prisma Studio:
```bash
npm run db:studio
```

## 📋 Test Checklist

When writing tests for a new module:

- [ ] Create service unit tests
- [ ] Test happy paths (success cases)
- [ ] Test error cases (validation, not found, forbidden)
- [ ] Test permission checks (owner/editor/viewer)
- [ ] Test edge cases (empty data, boundaries)
- [ ] Create integration tests for HTTP endpoints
- [ ] Test authentication requirements
- [ ] Test input validation
- [ ] Test response format
- [ ] Verify database state after operations

## 🎯 Best Practices

### DO ✅

- Use descriptive test names
- Test one thing per test case
- Use helpers to reduce boilerplate
- Clean up test data (handled automatically)
- Test both success and failure cases
- Verify database state changes
- Check error messages and types

### DON'T ❌

- Share state between tests
- Use real production data
- Skip cleanup (causes test pollution)
- Test implementation details
- Write overly complex tests
- Ignore flaky tests
- Commit failing tests

## 🔍 Common Issues

### "Database connection failed"

Make sure PostgreSQL is running:
```bash
docker compose up -d postgres
```

### "Table does not exist"

Run migrations:
```bash
npm run db:push
```

### "Tests timing out"

Increase timeout in `vitest.config.ts`:
```typescript
testTimeout: 15000, // 15 seconds
```

### "Port already in use"

Another server instance is running. Stop it or change the port in `.env.test`.

## 📈 Coverage Reports

After running `npm run test:unit`, open the HTML report:

```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

The report shows:
- **Green**: Well-covered code (>80%)
- **Yellow**: Partially covered (50-80%)
- **Red**: Poor coverage (<50%)

Focus on covering:
1. Critical business logic
2. Error handling paths
3. Permission checks
4. Data validation

## 🚀 CI/CD Integration

For continuous integration, add to your pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: gift_map_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run db:push
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Questions?** Check the main README or open an issue.
