# Frontend Unit Test Documentation

**Project:** Storage Unit Integrated Tools (SUIT)  
**Framework:** Jest + React Testing Library  
**Language:** TypeScript

---

## Overview

The frontend test suite validates individual components and utility functions to ensure correctness, prevent regressions, and give the team confidence when shipping changes. Tests are run locally during development and automatically in the CI/CD pipeline.

---

## Test Files

### Component Tests

These tests cover rendering, user interaction, and conditional display logic for React components.

| File | What it covers |
|---|---|
| `Button.test.tsx` | Rendering and click handler behavior |
| `LoginForm.test.tsx` | Input handling, error messages, and form submission |
| `Dashboard.test.tsx` | Data rendering and empty/loading states |
| `ItemCard.test.tsx` | Correct display of item details |
| `NavigationBar.test.tsx` | Navigation links and active state styling |

### Utility Function Tests

These tests cover shared helper functions used across the application.

| File | What it covers |
|---|---|
| `validation.test.ts` | Email and password validation logic |
| `formatDate.test.ts` | Consistent date formatting output |
| `calculateStorage.test.ts` | Storage usage calculation accuracy |

---

## Coverage Areas

**Components**
- Renders correctly with expected props
- User interactions (clicks, form submissions) trigger the right handlers
- Conditional states (loading, error, empty data) render appropriately

**Utilities**
- Invalid inputs are caught and return correct error messages
- Data is formatted consistently for display
- Business logic calculations produce accurate results

---

## Example Tests

### Button Component

```typescript
import { render, fireEvent } from '@testing-library/react';
import Button from '../components/Button';

describe('Button Component', () => {
  it('renders with the correct label', () => {
    const { getByText } = render(<Button label="Click Me" onClick={() => {}} />);
    expect(getByText('Click Me')).toBeInTheDocument();
  });

  it('triggers onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button label="Click Me" onClick={handleClick} />);
    fireEvent.click(getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Email Validation Utility

```typescript
import { validateEmail } from '../utils/validation';

describe('validateEmail', () => {
  it('returns true for a valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('returns false for an invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

---

## Best Practices

- **Isolate tests** — each test targets a single piece of functionality.
- **Mock external dependencies** — API calls and other side effects are mocked to keep tests deterministic.
- **Write descriptive names** — test names read as plain English sentences that describe the expected behavior.
- **Run often** — tests run on every save locally and on every push in CI.

---

## Roadmap

- [ ] Add tests for untested components and edge cases to increase overall coverage
- [ ] Implement integration tests for component interaction flows
- [ ] Add performance tests for components under heavy data loads
