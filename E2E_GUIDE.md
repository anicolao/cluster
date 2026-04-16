# E2E Testing Guide: Cluster

This document is the **definitive guide** for writing End-to-End (E2E) tests for Cluster. It is designed to ensure robust, deterministic, and self-documenting tests.

## 1. The Philosophy: "Zero-Pixel Tolerance"

In Cluster, visual state is the primary feedback mechanism. If a UI element is misaligned or missing, it's a bug.

- **Determinism**: Tests must be 100% deterministic. No random seeds allowed in tests.
- **Visual Snapshots**: Every test step must capture a visual snapshot (screenshot) to verify layout and rendering.
- **Unified Step Pattern**: Documentation, verification, and screenshot capturing are handled by a single atomic `step()` call to prevent synchronization errors.

## 2. Prohibitions & Hard Requirements

1. **No Timeouts > 2000ms**: The maximum acceptable timeout for any condition is **2000ms**.
2. **No `waitForTimeout`**: You are strictly prohibited from using `page.waitForTimeout()` or `page.waitFor()`.
3. **No Animations**: Use the `waitForAnimations` utility to ensure all CSS animations/transitions are finished before capturing a snapshot.
4. **Resilient Locators**: Use user-facing attributes (labels, roles, text) rather than fragile CSS classes.

## 3. The "Unified Step Pattern"

We use a helper class `TestStepHelper` to manage atomic test steps. You must **NEVER** manually manage screenshot filenames or counters.

### Directory Convention
Tests are organized by scenario in numbered folders within `tests/e2e/`.

```
tests/e2e/
├── helpers/ # Shared utilities (TestStepHelper)
├── 001-scenario-name/ # Scenario Directory
│   ├── 001-scenario-name.spec.ts # Main test file
│   ├── README.md # Auto-generated verification doc
│   └── screenshots/ # Committed baseline images
```

The generated `README.md` and every screenshot under `screenshots/` are part of the committed test artifact set.

### Basic Usage

```typescript
import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('Lobby renders correctly', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Initial Lobby Rendering', 'As a player, I want to see the lobby landing page.');

  await page.goto('/');

  await tester.step('initial-load', {
    description: 'Landing Page',
    verifications: [
      { spec: 'Title is visible', check: async () => await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible() }
    ]
  });

  tester.generateDocs();
});
```

## 4. TestStepHelper Implementation

The `TestStepHelper` (located in `tests/e2e/helpers/test-step-helper.ts`) automatically:
1. **Auto-Names**: Generates names like `000-initial-load.png`.
2. **Waits for Animations**: Calls `waitForAnimations(page)` before taking a screenshot.
3. **Runs Verifications**: Executes all checks and fails the test if any fail.
4. **Generates README**: Appends the step results to the scenario's documentation.

After running the scenario, commit the regenerated `README.md` and screenshot outputs.

## 5. Firebase Emulator

E2E tests must run against the Firebase Emulator. Use `npm run test:e2e` to execute tests in an isolated environment.
