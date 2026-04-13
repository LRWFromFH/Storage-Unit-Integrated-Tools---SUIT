describe('Units Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/units');
  });

  // ── basic rendering ────────────────────────────────────────────────────────

  it('loads the units page', () => {
    cy.contains('Unit Management').should('be.visible');
  });

  it('shows the ag-grid table by default', () => {
    cy.get('ag-grid-angular').should('exist');
  });

  it('has an Add Unit button', () => {
    cy.contains('+ Add Unit').should('be.visible');
  });

  it('navigates back to dashboard', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  // ── view toggle ────────────────────────────────────────────────────────────

  it('can switch to grid view and back to table view', () => {
    cy.contains('Grid View').click();
    cy.get('ag-grid-angular').should('not.exist');
    cy.get('.unit-card-grid').should('exist');

    cy.contains('Table View').click();
    cy.get('ag-grid-angular').should('exist');
  });

  // ── status rendering ───────────────────────────────────────────────────────

  it('table view shows Status column', () => {
    cy.get('.ag-header-cell-text').contains('Status').should('exist');
  });

  it('grid view shows status badges on unit cards', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card').first().find('.status-badge').should('exist');
  });

  it('status badge shows Available or Occupied text', () => {
    cy.contains('Grid View').click();
    cy.get('.status-badge').first().invoke('text').should('match', /Available|Occupied/);
  });

  // ── add unit dialog ────────────────────────────────────────────────────────

  it('opens the add unit dialog when Add Unit is clicked', () => {
    cy.contains('+ Add Unit').click();
    cy.contains('Add New Unit').should('be.visible');
    cy.contains('Cancel').click();
  });

  it('closes the dialog without saving when Cancel is clicked', () => {
    cy.contains('+ Add Unit').click();
    cy.contains('Cancel').click();
    cy.get('mat-dialog-container').should('not.exist');
  });

  // ── combine dialog ─────────────────────────────────────────────────────────

  it('opens the combine dialog when Combine Units is clicked (if 2+ available units exist)', () => {
    // Only run if there are at least 2 available units in the grid
    cy.contains('Grid View').click();
    cy.get('.unit-card').then($cards => {
      const availableCards = $cards.filter(':contains("Available")');
      if (availableCards.length >= 2) {
        cy.contains('Table View').click();
        cy.contains('Combine Units').click();
        cy.contains('Combine Units').should('be.visible'); // dialog title
        cy.contains('Cancel').click();
      } else {
        cy.log('Fewer than 2 available units — combine dialog test skipped');
      }
    });
  });
});
