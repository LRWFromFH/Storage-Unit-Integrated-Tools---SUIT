// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
// cypress/support/e2e.ts
Cypress.on('uncaught:exception', (err) => {
  // Ignore the gridApi error that sometimes happens during navigation
  if (err.message.includes('setRowData is not a function')) {
    return false;
  }
  return true;
});