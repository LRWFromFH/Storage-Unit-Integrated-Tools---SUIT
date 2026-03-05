describe('Tenants Page', () => {

  beforeEach(() => {

    cy.login();

    // now visit tenants
    cy.visit('http://localhost:4200/tenants');

  });

  it('loads tenants page', () => {
    cy.contains('Tenant Management').should('be.visible');
  });

  it('switches to grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').should('exist');
  });

  it('shows table view', () => {
    cy.contains('Table View').click();
    cy.get('ag-grid-angular').should('exist');
  });

  it('goes back to dashboard', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

});