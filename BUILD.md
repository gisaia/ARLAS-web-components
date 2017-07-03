## Build an Angular component :

### Create a module

- In this module, never import BrowserModule. You can import Common Module instead
- Do not mix components/directives/pipes and services in the same module. Because :
    - A service provided in a module will be available everywhere in the app, so your module should be imported only once, in the user app root module.
    - An exported component/directive/pipe will only be available in the module importing yours, so your module should be imported in every user module (root and/or feature modules) that need them (like the CommonModule).
- Never use browser-specific APIs (like the DOM) directly
- Module example : histogram.module.ts

```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistogramComponent } from './histogram.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [HistogramComponent],
  exports: [HistogramComponent]
})
export class HistogramModule {}

```
