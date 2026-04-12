describe('Tenants Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/tenants');
  });

  it('loads the tenants page', () => {
    cy.contains('Tenant Management').should('be.visible');
  });

  it('shows the ag-grid table by default', () => {
    cy.get('ag-grid-angular').should('exist');
  });

  it('can switch to grid view and back to table view', () => {
    cy.contains('Grid View').click();
    cy.get('ag-grid-angular').should('not.exist');
    cy.get('.tenant-card-grid').should('exist');

    cy.contains('Table View').click();
    cy.get('ag-grid-angular').should('exist');
  });

  it('has an Add Customer button', () => {
    cy.contains('+ Add Customer').should('be.visible');
  });

  it('opens the add customer dialog when Add Customer is clicked', () => {
    cy.contains('+ Add Customer').click();
    cy.contains('Add New Customer').should('be.visible');
    cy.contains('Cancel').click();
  });

  it('navigates back to dashboard', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

});