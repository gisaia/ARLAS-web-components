import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultListComponent } from './result-list/result-list.component';
import { ResultGridTileComponent } from './result-grid-tile/result-grid-tile.component';
import { ResultDetailedGridComponent } from './result-detailed-grid/result-detailed-grid.component';

import { ResultItemComponent } from './result-item/result-item.component';
import { ResultDetailedItemComponent } from './result-detailed-item/result-detailed-item.component';
import { ResultFilterComponent } from './result-filter/result-filter.component';
import { ResultScrollDirective } from './result-directive/result-scroll.directive';
import { LoadingModule, ANIMATION_TYPES } from 'ngx-loading';
import { MdIconModule, MdChipsModule, MdButtonToggleModule, MdButtonModule,
   MdGridListModule, MdCheckboxModule, MdMenuModule, MdTooltipModule } from '@angular/material';





@NgModule({
  imports: [
    CommonModule,
    MdIconModule,
    MdChipsModule,
    MdButtonToggleModule,
    MdButtonModule,
    MdGridListModule,
    MdCheckboxModule,
    MdMenuModule,
    MdTooltipModule,
    FormsModule,
    LoadingModule
  ],
  declarations: [ResultListComponent, ResultGridTileComponent,
   ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent, ResultFilterComponent, ResultScrollDirective],
  exports: [ResultListComponent, ResultGridTileComponent,
   ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent, ResultFilterComponent, ResultScrollDirective],

})
export class ResultsModule {}
