# Platform API Test Suite

Integration tests for the dante.id self-building pipeline platform APIs.

## Endpoints Tested

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/platform/context` | GET | Returns codebase structure for AI context |
| `/api/platform/apply` | POST | Applies internal project builds to codebase |
| `/api/platform/status` | GET | Dashboard of internal projects |
| `/api/platform/analytics` | GET | Pipeline metrics & trends |
| `/api/platform/health` | GET | Success/failure rates |
| `/api/platform/test-pipeline` | POST | E2E smoke test |

## Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm test -- --coverage
```

## Test Structure

```
tests/
├── platform-api.test.js    # Main test suite
├── utils/
│   └── mocks.js            # Mock data and utilities
└── integration/
    └── pipeline.test.js    # Full pipeline integration tests
```

## Environment Variables

Required for testing:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `GH_TOKEN`

## CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main`
