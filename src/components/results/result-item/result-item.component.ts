import { Component, OnInit, Input, Output } from '@angular/core';
import { Item } from '../model/item';
import { ItemComponent } from '../model/itemComponent';
import { ModeEnum } from '../utils/enumerations/modeEnum';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';

import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: '[arlas-result-item]',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.css']
})
export class ResultItemComponent extends ItemComponent implements OnInit {

  public HIDE_DETAILS = 'Hide details';
  public SHOW_DETAILS = 'Show details';

  @Input() public rowItem: Item;
  @Input() public detailedDataRetriever: DetailedDataRetriever;
  @Input() public selectedItems: Set<string>;

  @Output() public selectedItemsEvent: Subject<Set<string>> = new Subject<Set<string>>();
  @Output() public selectedItemPositionEvent: Subject<Item> = new Subject<Item>();

  @Output() public borderStyleEvent: Subject<string> = new Subject<string>();

  public isDetailToggled = false;
  public detailedData = '';
  public actions;
  public borderStyle = 'solid';
  protected identifier: string;

  constructor() {
    super();
  }

  public ngOnInit() {
    this.identifier = this.rowItem.identifier;
  }

  // Detailed data is retrieved wheb the row is toggled for the first time
  public toggle() {
    if (this.rowItem.isDetailToggled === false) {
      this.retrieveDetailedData(this.detailedDataRetriever, this.rowItem);
      this.borderStyle = 'dashed';
    } else {
      this.borderStyle = 'solid';
    }
    this.borderStyleEvent.next(this.borderStyle);
    this.rowItem.isDetailToggled = !this.rowItem.isDetailToggled;

  }

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.rowItem.isChecked, this.identifier, this.selectedItems);
    this.rowItem.isChecked = !this.rowItem.isChecked;
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.selectedItemsEvent.next(this.selectedItems);
    this.selectedItemPositionEvent.next(this.rowItem);
  }
  public determinateItem() {
    this.rowItem.isChecked = true;
    this.rowItem.isindeterminated = false;
    this.selectedItems.add(this.identifier);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.selectedItemsEvent.next(this.selectedItems);
    this.selectedItemPositionEvent.next(this.rowItem);
  }

}
