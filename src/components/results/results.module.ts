import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultListComponent } from './result-list/result-list.component';
import { ResultItemComponent } from './result-item/result-item.component';
import { ResultDetailedItemComponent } from './result-detailed-item/result-detailed-item.component';
import { ResultFilterComponent } from './result-filter/result-filter.component';
import { ResultScrollDirective } from './result-directive/result-scroll.directive';
import { LoadingModule, ANIMATION_TYPES } from 'ngx-loading';
import { MdIconModule } from '@angular/material';




@NgModule({
  imports: [
    CommonModule,
    MdIconModule,
    FormsModule,
    LoadingModule
  ],
  declarations: [ResultListComponent, ResultItemComponent, ResultDetailedItemComponent, ResultFilterComponent, ResultScrollDirective],
  exports: [ResultListComponent, ResultItemComponent, ResultDetailedItemComponent, ResultFilterComponent, ResultScrollDirective]
})
export class ResultsModule {}
