import './commands';

// Prevent Cypress from failing tests on uncaught Angular/zone.js exceptions
Cypress.on('uncaughtException', (_err) => false);
