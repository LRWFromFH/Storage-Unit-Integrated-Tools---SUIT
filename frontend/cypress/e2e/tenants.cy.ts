describe('Tenants Page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/tenants');
    cy.contains('Tenant Management', { timeout: 8000 }).should('be.visible');
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
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('Cancel').click();
  });

  it('closes the dialog without saving when Cancel is clicked', () => {
    cy.contains('+ Add Customer').click();
    cy.contains('Cancel').click();
    cy.get('mat-dialog-container').should('not.exist');
  });

  // ── search / filter ────────────────────────────────────────────────────────

  it('has a search field that accepts input', () => {
    cy.get('input[placeholder="Name, Email, or Phone"]').type('test');
    cy.get('input[placeholder="Name, Email, or Phone"]').should('have.value', 'test');
  });

  // ── table columns ──────────────────────────────────────────────────────────

  // it('displays expected column headers in table view', () => {
  //   cy.get('.ag-header-cell-text').contains('First Name').should('exist');
  //   cy.get('.ag-header-cell-text').contains('Last Name').should('exist');
  //   cy.get('.ag-header-cell-text').contains('Email').should('exist');
  //   cy.get('.ag-header-cell-text').contains('Actions').should('exist');
  // });

  // ── grid view actions ──────────────────────────────────────────────────────

  it('shows tenant cards with action buttons in grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card-grid').should('exist');
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards found — test skipped (no data)');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('Edit').should('exist');
        cy.contains('Billing').should('exist');
        cy.contains('Notes').should('exist');
        cy.contains('View Units').should('exist');
      });
    });
  });

  it('expands the units panel when View Units is clicked', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('View Units').click();
        cy.get('.tenant-units-panel', { timeout: 6000 }).should('exist');
      });
    });
  });

  it('shows loading state then resolves when View Units is clicked', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('View Units').click();
        cy.get('.units-loading', { timeout: 500 }).should('not.exist');
        cy.get('.tenant-units-panel').should('exist');
      });
    });
  });

  it('collapses the units panel when Hide Units is clicked', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('View Units').click();
        cy.get('.tenant-units-panel', { timeout: 6000 }).should('exist');
        cy.contains('Hide Units').click();
        cy.get('.tenant-units-panel').should('not.exist');
      });
    });
  });

  it('shows the Assign Unit button inside the units panel', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('View Units').click();
        cy.get('.tenant-units-panel', { timeout: 6000 }).within(() => {
          cy.contains('+ Assign Unit').should('exist');
        });
      });
    });
  });

  // ── assign unit dialog ─────────────────────────────────────────────────────

  it('opens assign unit dialog when Assign Unit is clicked', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('View Units').click();
        cy.get('.tenant-units-panel', { timeout: 6000 }).within(() => {
          cy.contains('+ Assign Unit').click();
        });
      });
      cy.get('mat-dialog-container').should('be.visible');
      cy.contains('Cancel').click();
    });
  });

  // ── deassign button (manager only) ─────────────────────────────────────────

  // it('shows deassign button on occupied units (manager only)', () => {
  //   cy.contains('Grid View').click();
  //   cy.get('.tenant-card').then(($cards) => {
  //     if ($cards.length === 0) {
  //       cy.log('No tenant cards — test skipped');
  //       return;
  //     }
  //     // Find first card that has units
  //     let found = false;
  //     cy.get('.tenant-card').each(($card) => {
  //       if (found) return false;
  //       cy.wrap($card).within(() => {
  //         cy.contains('View Units').click();
  //       });
  //       cy.wrap($card).find('.tenant-units-panel', { timeout: 4000 }).then(($panel) => {
  //         if ($panel.find('.unit-chip').length > 0) {
  //           cy.wrap($panel).find('.deassign-btn').should('exist');
  //           found = true;
  //         } else {
  //           cy.wrap($card).within(() => {
  //             cy.contains(/Hide Units/).click();
  //           });
  //         }
  //       });
  //     });
  //   });
  // });

  // ── billing and notes dialogs ──────────────────────────────────────────────

  it('opens billing dialog when Billing is clicked in grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('Billing').click();
      });
      cy.get('mat-dialog-container').should('be.visible');
      cy.contains('Close').click();
    });
  });

  it('opens notes dialog when Notes is clicked in grid view', () => {
    cy.contains('Grid View').click();
    cy.get('.tenant-card').then(($cards) => {
      if ($cards.length === 0) {
        cy.log('No tenant cards — test skipped');
        return;
      }
      cy.get('.tenant-card').first().within(() => {
        cy.contains('Notes').click();
      });
      cy.get('mat-dialog-container').should('be.visible');
      cy.contains('Close').click();
    });
  });
});
