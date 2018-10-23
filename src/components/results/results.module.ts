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
import { LoadingModule } from 'ngx-loading';
import {
  MatIconModule, MatChipsModule, MatButtonToggleModule, MatButtonModule,
  MatGridListModule, MatCheckboxModule, MatMenuModule, MatTooltipModule, MatSelectModule
} from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatGridListModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    LoadingModule,
    TranslateModule
  ],
  declarations: [ResultListComponent, ResultGridTileComponent,
    ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent, ResultFilterComponent, ResultScrollDirective],
  exports: [ResultListComponent, ResultGridTileComponent,
    ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent, ResultFilterComponent, ResultScrollDirective],

})
export class ResultsModule { }
