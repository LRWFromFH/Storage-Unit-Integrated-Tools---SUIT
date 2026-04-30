/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.session('admin-session', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@gmail.com');
    cy.get('input[type="password"]').type('12345678');
    cy.contains('Sign').click();
    cy.url().should('include', '/dashboard');
  }, {
    cacheAcrossSpecs: true
  });
});

export {};
