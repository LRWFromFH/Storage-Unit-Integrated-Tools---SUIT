describe('Units Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/units');
    cy.contains('Unit Management', { timeout: 8000 }).should('be.visible');
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

  it('has a Combine Units button', () => {
    cy.contains('Combine Units').should('be.visible');
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

  // ── filter bar ─────────────────────────────────────────────────────────────

  it('has a search input in the filter bar', () => {
    cy.get('input[placeholder="e.g. A101"]').should('exist');
  });

  it('has a Size filter dropdown', () => {
    cy.contains('mat-label', 'Size').should('exist');
  });

  it('has a Max Budget filter input', () => {
    cy.contains('mat-label', 'Max Budget').should('exist');
  });

  // ── status rendering ───────────────────────────────────────────────────────

  it('table view shows Status column', () => {
    cy.get('.ag-header-cell-text').contains('Status').should('exist');
  });

  it('grid view shows status badges on unit cards', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card-grid').should('exist');
    cy.get('.unit-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No unit cards — test skipped');
        return;
      }
      cy.get('.unit-card').first().find('.suit-badge').should('exist');
    });
  });

  it('status badge shows Available or Occupied text', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No unit cards — test skipped');
        return;
      }
      cy.get('.suit-badge').first().invoke('text').invoke('trim')
        .should('match', /Available|Occupied/);
    });
  });

  // ── table column headers ───────────────────────────────────────────────────

  it('displays expected column headers', () => {
    cy.get('.ag-header-cell-text').contains('Unit #').should('exist');
    cy.get('.ag-header-cell-text').contains('Size Type').should('exist');
    cy.get('.ag-header-cell-text').contains('Price').should('exist');
    cy.get('.ag-header-cell-text').contains('Actions').should('exist');
  });

  // ── add unit dialog ────────────────────────────────────────────────────────

  it('opens the add unit dialog when Add Unit is clicked', () => {
    cy.contains('+ Add Unit').click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('Cancel').click();
  });

  it('closes the dialog without saving when Cancel is clicked', () => {
    cy.contains('+ Add Unit').click();
    cy.contains('Cancel').click();
    cy.get('mat-dialog-container').should('not.exist');
  });

  // ── combine dialog ─────────────────────────────────────────────────────────

  it('opens the combine dialog when Combine Units is clicked (if 2+ available units exist)', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card-grid').should('exist');
    cy.get('body').then(($body) => {
      const availableCount = $body.find('.suit-badge.badge-success').length;
      if (availableCount >= 2) {
        cy.contains('Table View').click();
        cy.contains('Combine Units').click();
        cy.get('mat-dialog-container').should('be.visible');
        cy.contains('Cancel').click();
      } else {
        cy.log(`Only ${availableCount} available units — combine dialog skipped`);
      }
    });
  });

  // ── unit card actions ──────────────────────────────────────────────────────

  it('shows Edit and Insurance buttons on unit cards in grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No unit cards — test skipped');
        return;
      }
      cy.get('.unit-card').first().within(() => {
        cy.contains('Edit').should('exist');
        cy.contains('Insurance').should('exist');
      });
    });
  });

  it('opens insurance dialog when Insurance button clicked on a unit card', () => {
    cy.contains('Grid View').click();
    cy.get('.unit-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No unit cards — test skipped');
        return;
      }
      cy.get('.unit-card').first().within(() => {
        cy.contains('Insurance').click();
      });
      cy.get('mat-dialog-container').should('be.visible');
      cy.contains('Close').click();
    });
  });
});
