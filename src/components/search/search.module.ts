import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MdCommonModule,
  MdInputModule,
} from '@angular/material';
import { SearchComponent } from './search.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdInputModule
  ],
  declarations: [SearchComponent],
  exports: [SearchComponent]
})
export class SearchModule {}
