import { Component, OnInit, Input, Output } from '@angular/core';
import { Item } from '../model/item';
import { ItemComponent } from '../model/itemComponent';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, ProductIdentifier } from '../utils/results.utils';


import { Observable } from 'rxjs/Rx';
import { ModeEnum } from '../utils/enumerations/modeEnum';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'arlas-result-grid-tile',
  templateUrl: './result-grid-tile.component.html',
  styleUrls: ['./result-grid-tile.component.css']
})
export class ResultGridTileComponent extends ItemComponent implements OnInit {

  @Input() public gridTile: Item;
  @Input() public selectedItems: Set<string>;

  @Output() public selectedItemsEvent: Subject<Set<string>> = new Subject<Set<string>>();

  constructor() {
    super();
  }

  public ngOnInit() {}

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.gridTile.isChecked, this.gridTile.identifier, this.selectedItems);
    this.gridTile.isChecked = !this.gridTile.isChecked;
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in list mode
    this.selectedItemsEvent.next(this.selectedItems);
  }

}
