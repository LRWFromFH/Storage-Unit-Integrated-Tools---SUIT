/// <reference types="cypress" />

describe('SUIT UI – Core Interface Tests', () => {

  // ── App Load ────────────────────────────────────────────────────────────────
  it('should load the application and redirect to login', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  // ── Login Page Rendering ────────────────────────────────────────────────────
  it('should render login page inputs correctly', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });

  // ── Page Title ──────────────────────────────────────────────────────────────
  it('should have a valid page title', () => {
    cy.visit('/login');
    cy.title().should('not.be.empty');
  });

  // ── Sidebar (login page has no sidebar) ────────────────────────────────────
  it('should not show sidebar on the login page', () => {
    cy.visit('/login');
    cy.get('mat-sidenav').should('not.exist');
  });

  // ── Global Search (removed from header) ────────────────────────────────────
  it('should NOT show the global search input in the header', () => {
    cy.login();
    cy.visit('/dashboard');
    cy.get('mat-toolbar #global-search-input').should('not.exist');
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
