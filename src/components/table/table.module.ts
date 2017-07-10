import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './table.component';
import { Ng2SmartTableModule } from "ng2-smart-table";

@NgModule({
  imports: [
    CommonModule,
    Ng2SmartTableModule,
  ],
  declarations: [TableComponent],
  exports: [TableComponent]
})
export class TableModule {}
