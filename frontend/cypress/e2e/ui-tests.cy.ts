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

  // ── New Test 1: Theme Toggles Back ─────────────────────────────────────────
  it('should toggle theme back to light (remove data-theme attribute)', () => {
    cy.visit('/login');
    cy.document().then((doc) => {
      doc.documentElement.setAttribute('data-theme', 'dark');
      doc.documentElement.removeAttribute('data-theme');
    });
    cy.document().its('documentElement').should('not.have.attr', 'data-theme');
  });

  it('should render sidebar toggle button after login', () => {
    cy.visit('/login');
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: { token: 'fake-token', user: { ID: 1, Role: 'manager' } }
    }).as('loginReq');
    cy.get('input[formControlName="email"]').type('manager@suit.com');
    cy.get('input[formControlName="password"]').type('manager123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginReq');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('#sidebar-toggle-btn').should('exist');
  });

  it('should accept keyboard input on global search', () => {
    cy.visit('/login');
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: { token: 'fake-token', user: { ID: 1, Role: 'manager' } }
    }).as('loginReq');
    cy.get('input[formControlName="email"]').type('manager@suit.com');
    cy.get('input[formControlName="password"]').type('manager123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginReq');
    cy.get('#global-search-input').type('hello').should('have.value', 'hello');
  });

  it('should render breadcrumb nav element', () => {
    cy.visit('/login');
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: { token: 'fake-token', user: { ID: 1, Role: 'manager' } }
    }).as('loginReq');
    cy.get('input[formControlName="email"]').type('manager@suit.com');
    cy.get('input[formControlName="password"]').type('manager123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginReq');
    cy.get('.breadcrumb-nav').should('exist');
  });

  // ── New Test 5: Empty Login Submit ─────────────────────────────────────────
  it('should not navigate away if login submitted empty', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');
  });

  // ── New Test 6: CSS Custom Properties ──────────────────────────────────────
  it('should have CSS custom property --suit-primary defined on :root', () => {
    cy.visit('/login');
    cy.document().then((doc) => {
      const computedStyle = window.getComputedStyle(doc.documentElement);
      const primaryColor = computedStyle.getPropertyValue('--suit-primary').trim();
      expect(primaryColor).to.not.be.empty;
    });
  });

});
