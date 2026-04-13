describe('Tenants Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/tenants');
  });

  // ── basic rendering ────────────────────────────────────────────────────────

  it('loads the tenants page', () => {
    cy.contains('Tenant Management').should('be.visible');
  });

  it('shows the ag-grid table by default', () => {
    cy.get('ag-grid-angular').should('exist');
  });

  it('has an Add Customer button', () => {
    cy.contains('+ Add Customer').should('be.visible');
  });

  it('navigates back to dashboard', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  // ── view toggle ────────────────────────────────────────────────────────────

  it('can switch to grid view and back to table view', () => {
    cy.contains('Grid View').click();
    cy.get('ag-grid-angular').should('not.exist');
    cy.get('.tenant-card-grid').should('exist');

    cy.contains('Table View').click();
    cy.get('ag-grid-angular').should('exist');
  });

  // ── add customer dialog ────────────────────────────────────────────────────

  it('opens the add customer dialog when Add Customer is clicked', () => {
    cy.contains('+ Add Customer').click();
    cy.contains('Add New Customer').should('be.visible');
    cy.contains('Cancel').click();
  });

  it('closes the dialog without saving when Cancel is clicked', () => {
    cy.contains('+ Add Customer').click();
    cy.contains('Cancel').click();
    cy.get('mat-dialog-container').should('not.exist');
  });

  // ── view units panel ───────────────────────────────────────────────────────

  it('shows View Units button on each card in grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').first().within(() => {
      cy.contains('View Units').should('exist');
    });
  });

  it('expands the units panel when View Units is clicked', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').first().within(() => {
      cy.contains('View Units').click();
      // Should show either units or "No units assigned"
      cy.get('.tenant-units-panel').should('exist');
    });
  });

  it('shows loading state briefly then shows units or empty message', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').first().within(() => {
      cy.contains('View Units').click();
      // After loading, panel should NOT be stuck on "Loading units"
      cy.get('.units-loading').should('not.exist');
      cy.get('.tenant-units-panel').should('exist');
    });
  });

  it('collapses the units panel when Hide Units is clicked', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').first().within(() => {
      cy.contains('View Units').click();
      cy.get('.tenant-units-panel').should('exist');
      cy.contains('Hide Units').click();
      cy.get('.tenant-units-panel').should('not.exist');
    });
  });

  it('shows the Assign Unit button inside the units panel', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').first().within(() => {
      cy.contains('View Units').click();
      cy.contains('Assign Unit').should('exist');
    });
  });
});
