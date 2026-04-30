describe('Employee Management Page (Manager only)', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/register');
  });

  // ── access guard ───────────────────────────────────────────────────────────

  it('loads the employee management page', () => {
    cy.url().should('include', '/register');
    cy.contains('Register New Employee').should('be.visible');
    cy.contains('Update Employee Role').should('be.visible');
  });

  it('shows the employee list card', () => {
    cy.url().should('include', '/register');
    cy.contains('All Employees').should('be.visible');
  });

  it('shows the employee table or empty state after loading', () => {
    cy.url().should('include', '/register');
    cy.get('.list-loading', { timeout: 6000 }).should('not.exist');
    cy.get('.employee-table, .no-employees').should('exist');
  });

  it('employee table has expected columns when employees exist', () => {
    cy.url().should('include', '/register');
    cy.get('.list-loading', { timeout: 6000 }).should('not.exist');
    cy.get('.employee-table').then($table => {
      if ($table.length) {
        cy.get('.employee-table th').contains('DB ID').should('exist');
        cy.get('.employee-table th').contains('Employee ID').should('exist');
        cy.get('.employee-table th').contains('Email').should('exist');
        cy.get('.employee-table th').contains('Role').should('exist');
      } else {
        cy.log('No employees yet — column test skipped');
      }
    });
  });

  it('navigates back to dashboard', () => {
    cy.url().should('include', '/register');
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  // ── register employee form ─────────────────────────────────────────────────

  it('has the register form fields', () => {
    cy.url().should('include', '/register');
    cy.get('input[formControlName="username"]').should('exist');
    cy.get('input[formControlName="email"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
  });

  it('Create Employee button is disabled when form is empty', () => {
    cy.url().should('include', '/register');
    cy.contains('Create Employee Account').should('be.disabled');
  });

  it('shows validation error for short username', () => {
    cy.url().should('include', '/register');
    cy.get('input[formControlName="username"]').type('ab').blur();
    cy.contains('Minimum 3 characters').should('be.visible');
  });

  it('shows validation error for invalid email', () => {
    cy.url().should('include', '/register');
    cy.get('input[formControlName="email"]').type('notanemail').blur();
    cy.contains('Invalid email format').should('be.visible');
  });

  it('shows validation error for short password', () => {
    cy.url().should('include', '/register');
    cy.get('input[formControlName="password"]').type('short').blur();
    cy.contains('Minimum 8 characters').should('be.visible');
  });

  // ── update role form ───────────────────────────────────────────────────────

  it('has the update role form with employee and manager options', () => {
    cy.url().should('include', '/register');
    cy.get('input[formControlName="employeeId"]').should('exist');
    cy.get('mat-select[formControlName="role"]').should('exist');
  });

  it('Update Role button is disabled when employee ID is empty', () => {
    cy.url().should('include', '/register');
    cy.contains('Update Role').should('be.disabled');
  });

  it('shows error message when updating a non-existent employee ID', () => {
    cy.url().should('include', '/register');
    cy.intercept('POST', '**/employees/*/role').as('updateRole');
    cy.get('input[formControlName="employeeId"]').type('99999');
    cy.contains('Update Role').click();
    cy.wait('@updateRole', { timeout: 8000 });
    cy.contains(/not found/i).should('be.visible');
  });
});
