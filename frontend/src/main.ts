import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  PaginationModule
} from 'ag-grid-community';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  PaginationModule
]);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
