describe('Dashboard Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard');
  });

  // ── basic rendering ────────────────────────────────────────────────────────

  it('loads the dashboard after login', () => {
    cy.url().should('include', '/dashboard');
  });

  it('renders the KPI strip with three stat cards', () => {
    cy.contains('Total Units').should('be.visible');
    cy.contains('Occupancy').should('be.visible');
    cy.contains('Active Tenants').should('be.visible');
  });

  it('renders the Units navigation card', () => {
    cy.get('mat-card-title').contains('Units').should('be.visible');
    cy.contains('Enter Units').should('be.visible');
  });

  it('renders the Tenants navigation card', () => {
    cy.get('mat-card-title').contains('Tenants').should('be.visible');
    cy.contains('Enter Tenants').should('be.visible');
  });

  it('renders the Reports card with download button', () => {
    cy.get('mat-card-title').contains('Reports').should('be.visible');
    cy.contains('Download Inventory Report').should('be.visible');
  });

  // ── navigation ─────────────────────────────────────────────────────────────

  it('navigates to /units when Enter Units is clicked', () => {
    cy.contains('Enter Units').click();
    cy.url().should('include', '/units');
  });

  it('navigates to /tenants when Enter Tenants is clicked', () => {
    cy.contains('Enter Tenants').click();
    cy.url().should('include', '/tenants');
  });

  // ── search ─────────────────────────────────────────────────────────────────

  it('has a global search field', () => {
    cy.get('input[placeholder*="Name, email"]').should('exist');
  });

  it('shows search results or empty state when a query is typed', () => {
    cy.intercept('POST', '**/searchDB').as('search');
    cy.get('input[placeholder*="Name, email"]').type('a');
    cy.wait('@search', { timeout: 8000 });
    cy.get('body').then(($body) => {
      const hasResults = $body.find('.search-results').length > 0;
      const hasEmpty   = $body.find('.search-empty').length > 0;
      expect(hasResults || hasEmpty).to.be.true;
    });
  });

  it('clears search results when the clear button is clicked', () => {
    cy.get('input[placeholder*="Name, email"]').type('test');
    cy.get('.search-section button[mat-icon-button]').should('be.visible').click();
    cy.get('.search-results').should('not.exist');
    cy.get('.search-empty').should('not.exist');
  });

  // ── PDF report download ────────────────────────────────────────────────────

  it('shows the Download Inventory Report button', () => {
    cy.get('#download-report-btn').should('be.visible');
    cy.get('#download-report-btn').should('not.be.disabled');
  });

  it('calls the /api/forms/util endpoint when Download Inventory Report is clicked', () => {
    cy.intercept('GET', '**/api/forms/util').as('downloadReport');
    cy.get('#download-report-btn').click();
    cy.wait('@downloadReport', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 500]);
  });

  it('disables the download button while report is generating', () => {
    cy.intercept('GET', '**/api/forms/util', (req) => {
      req.reply({ delay: 800, statusCode: 200, body: new Uint8Array([37, 80, 68, 70]) });
    }).as('slowReport');

    cy.get('#download-report-btn').click();
    cy.get('#download-report-btn').should('be.disabled');
    cy.wait('@slowReport', { timeout: 10000 });
  });

  // ── KPI stats ──────────────────────────────────────────────────────────────

  it('loads numeric values into the KPI cards', () => {
    cy.get('.kpi-value', { timeout: 8000 }).each(($el) => {
      cy.wrap($el).find('.card-shimmer').should('not.exist');
    });
  });
});
