describe('Login Flow', () => {

  beforeEach(() => {
    cy.visit('/login');
  });

  it('shows the login page', () => {
    cy.contains('Sign').should('be.visible');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });

  it('redirects to dashboard on successful login', () => {
    cy.get('input[type="email"]').type('admin@gmail.com');
    cy.get('input[type="password"]').type('12345678');
    cy.contains('Sign').click();
    cy.url().should('include', '/dashboard');
  });

  it('shows an error on wrong credentials', () => {
    cy.get('input[type="email"]').type('wrong@gmail.com');
    cy.get('input[type="password"]').type('badpassword');
    cy.contains('Sign').click();
    cy.url().should('include', '/login');
    // An error message or notification should appear
    cy.contains(/invalid|incorrect|error/i).should('exist');
  });

  it('keeps the submit button disabled when fields are empty', () => {
    cy.contains('Sign').should('be.disabled');
  });

  it('redirects unauthenticated users from /dashboard to /login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('logs out and redirects to login', () => {
    cy.login();
    // Click the logout icon on the toolbar
    cy.get('mat-toolbar').find('button[mat-icon-button]').last().click();
    cy.url().should('include', '/login');
  });
});
