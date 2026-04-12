describe('Units Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/units');
  });

  it('loads the units page', () => {
    cy.contains('Unit Management').should('be.visible');
  });

  it('shows the ag-grid table by default', () => {
    cy.get('ag-grid-angular').should('exist');
  });

  it('can switch to grid view and back to table view', () => {
    cy.contains('Grid View').click();
    cy.get('ag-grid-angular').should('not.exist');
    cy.get('.unit-card-grid').should('exist');

    cy.contains('Table View').click();
    cy.get('ag-grid-angular').should('exist');
  });

  it('has an Add Unit button', () => {
    cy.contains('+ Add Unit').should('be.visible');
  });

  it('opens the add unit dialog when Add Unit is clicked', () => {
    cy.contains('+ Add Unit').click();
    cy.contains('Add New Unit').should('be.visible');
    cy.contains('Cancel').click();
  });

  it('navigates back to dashboard', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

});