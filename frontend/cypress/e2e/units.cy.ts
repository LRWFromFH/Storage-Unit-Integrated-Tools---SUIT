// cypress/e2e/units.cy.ts
describe('Units Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('http://localhost:4200/units');
    cy.wait(2000);
  });

  it('loads the units page', () => {
    cy.contains('Unit Management').should('be.visible');
  });

  it('shows table view with data', () => {
    cy.get('ag-grid-angular').should('exist');
    cy.contains('Unit 100').should('be.visible');   // adjust if your unit numbers are different
  });

  it('can switch to grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card').should('have.length.greaterThan', 0);
  });

  it('can switch back to table view', () => {
    cy.contains('Grid View').click();
    cy.contains('Table View').click();
    cy.get('ag-grid-angular').should('exist');
  });

  it('has Back to Dashboard button', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

});