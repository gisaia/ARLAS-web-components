import { Component, OnInit, Input, Output } from '@angular/core';
import { Item } from '../model/item';
import { ItemComponent } from '../model/itemComponent';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';

import { Subject } from 'rxjs';

@Component({
  selector: 'arlas-result-grid-tile',
  templateUrl: './result-grid-tile.component.html',
  styleUrls: ['./result-grid-tile.component.css']
})
export class ResultGridTileComponent extends ItemComponent implements OnInit {
  public SHOW_IMAGE = 'Click to show details';

  /**
   * @Input
   * @description An object representing an Item .
   */
  @Input() public gridTile: Item;
  /**
   * @Input
   * @description List of all selected items in the result-list.component.
   * This component sets directly this list.
   */
  @Input() public selectedItems: Set<string>;
  /**
   * @Input
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  @Input() public detailedDataRetriever: DetailedDataRetriever;

  /**
   * @Output
   * @description Emits the list of selected items in result-list.component.
   */
  @Output() public selectedItemsEvent: Subject<Set<string>> = new Subject<Set<string>>();

  /**
   * @Output
   * @description Emits the selected/unselected item.
   */
  @Output() public selectedItemPositionEvent: Subject<Item> = new Subject<Item>();

  /**
   * @Output
   * @description Emits the the item that it has been clicked on it.
   */
  @Output() public clickedOnItemEvent: Subject<Item> = new Subject<Item>();

  public errorImgUrl = './assets/no-view.png';

  constructor() {
    super();
  }

  public ngOnInit() { }

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.gridTile.isChecked, this.gridTile.identifier, this.selectedItems);
    this.gridTile.isChecked = !this.gridTile.isChecked;
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in list mode
    this.selectedItemsEvent.next(this.selectedItems);
    this.selectedItemPositionEvent.next(this.gridTile);
  }

  public determinateItem() {
    this.gridTile.isChecked = true;
    this.gridTile.isindeterminated = false;
    this.selectedItems.add(this.gridTile.identifier);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.selectedItemsEvent.next(this.selectedItems);
    this.selectedItemPositionEvent.next(this.gridTile);
  }

  public setClickedOnItem() {
    this.retrieveDetailedData(this.detailedDataRetriever, this.gridTile);
    this.clickedOnItemEvent.next(this.gridTile);

  }
}
