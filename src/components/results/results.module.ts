import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResultListComponent } from './result-list/result-list.component';
import { ResultItemComponent } from './result-item/result-item.component';
import { ResultDetailedItemComponent } from './result-detailed-item/result-detailed-item.component';
import { ResultFilterComponent } from './result-filter/result-filter.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [ResultListComponent, ResultItemComponent, ResultDetailedItemComponent, ResultFilterComponent],
  exports: [ResultListComponent, ResultItemComponent, ResultDetailedItemComponent, ResultFilterComponent]
})
export class ResultsModule {}
