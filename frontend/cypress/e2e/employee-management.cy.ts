describe('Employee Management Page (Manager only)', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/register');
  });

  // ── basic rendering ────────────────────────────────────────────────────────

  it('loads the employee management page', () => {
    cy.contains('Register New Employee').should('be.visible');
    cy.contains('Update Employee Role').should('be.visible');
  });

  it('shows the employee list card', () => {
    cy.contains('All Employees').should('be.visible');
  });

  it('shows the employee table (or empty state) after loading', () => {
    // Loading spinner should disappear
    cy.get('.list-loading').should('not.exist');
    // Either shows the table or the empty message
    cy.get('.employee-table, .no-employees').should('exist');
  });

  it('employee table has the expected columns when employees exist', () => {
    cy.get('.employee-table').then($table => {
      if ($table.length) {
        cy.get('.employee-table th').contains('DB ID').should('exist');
        cy.get('.employee-table th').contains('Employee ID').should('exist');
        cy.get('.employee-table th').contains('Email').should('exist');
        cy.get('.employee-table th').contains('Role').should('exist');
      } else {
        cy.log('No employees registered yet — column test skipped');
      }
    });
  });

  it('navigates back to dashboard', () => {
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  // ── register employee form ─────────────────────────────────────────────────

  it('has the register form fields', () => {
    cy.get('form').first().within(() => {
      cy.get('input[formControlName="username"]').should('exist');
      cy.get('input[formControlName="email"]').should('exist');
      cy.get('input[formControlName="password"]').should('exist');
    });
  });

  it('Create Employee button is disabled when form is empty', () => {
    cy.contains('Create Employee Account').should('be.disabled');
  });

  it('shows validation error for short username', () => {
    cy.get('input[formControlName="username"]').type('ab').blur();
    cy.contains('Minimum 3 characters').should('be.visible');
  });

  it('shows validation error for invalid email', () => {
    cy.get('input[formControlName="email"]').type('notanemail').blur();
    cy.contains('Invalid email format').should('be.visible');
  });

  it('shows validation error for short password', () => {
    cy.get('input[formControlName="password"]').type('short').blur();
    cy.contains('Minimum 8 characters').should('be.visible');
  });

  // ── update role form ───────────────────────────────────────────────────────

  it('has the update role form with employee and manager options', () => {
    cy.get('input[formControlName="employeeId"]').should('exist');
    cy.get('mat-select[formControlName="role"]').should('exist');
  });

  it('Update Role button is disabled when employee ID is empty', () => {
    cy.contains('Update Role').should('be.disabled');
  });

  it('shows error message when updating non-existent employee ID', () => {
    cy.get('input[formControlName="employeeId"]').type('99999');
    cy.contains('Update Role').click();
    cy.contains(/not found/i).should('be.visible');
  });
});
