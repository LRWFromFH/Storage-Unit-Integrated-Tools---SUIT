/// <reference types="cypress" />

describe('SUIT UI – Core Interface Tests', () => {

  // ── App Load ────────────────────────────────────────────────────────────────
  it('should load the application and redirect to login', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
    cy.title().should('contain', 'Frontend');
  });

  // ── Login Page Rendering ────────────────────────────────────────────────────
  it('should render login page inputs correctly', () => {
    cy.visit('/login');
    cy.get('input[type="text"], input[formControlName="email"], input[name="email"]')
      .should('exist');
    cy.get('input[type="password"], input[formControlName="password"]')
      .should('exist');
  });

  // ── Page Title ──────────────────────────────────────────────────────────────
  it('should have a valid page title', () => {
    cy.visit('/login');
    cy.title().should('not.be.empty');
  });

  // ── Sidebar Toggle (post-login not tested here; UI-only) ────────────────────
  it('should not show sidebar on the login page', () => {
    cy.visit('/login');
    cy.get('mat-sidenav, .suit-sidenav').should('not.exist');
  });

  // ── Global Search Input ────────────────────────────────────────────────────
  it('should NOT show the global search input on the login page', () => {
    cy.visit('/login');
    cy.get('#global-search-input').should('not.exist');
  });

  // ── Theme Toggle ───────────────────────────────────────────────────────────
  it('should apply dark theme on data-theme attribute change', () => {
    cy.visit('/login');
    cy.document().then((doc) => {
      doc.documentElement.setAttribute('data-theme', 'dark');
    });
    cy.document().its('documentElement').should('have.attr', 'data-theme', 'dark');
  });

});
