import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultListComponent } from './result-list/result-list.component';
import { ResultItemComponent } from './result-item/result-item.component';
import { ResultDetailedItemComponent } from './result-detailed-item/result-detailed-item.component';



@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ResultListComponent, ResultItemComponent, ResultDetailedItemComponent],
  exports: [ResultListComponent, ResultItemComponent, ResultDetailedItemComponent]
})
export class ResultsModule {}
