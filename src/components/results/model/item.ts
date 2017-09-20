import { Column } from './column';
import { Action, FieldsConfiguration } from '../utils/results.utils';

import { Subject } from 'rxjs/Subject';

export class Item {

  public identifier: string;
  public urlImage: string;
  public urlThumbnail: string;
  public title: string;

  public columns: Array<Column>;
  public itemData: Map<string, string | number | Date>;

  public itemDetailedData: Array<{
    group: string,
    details: Array<{
      key: string,
      value: string
    }>
  }> = new Array<{
    group: string,
    details: Array<{
      key: string,
      value: string
    }>
  }>();
  public actions: Array<Action>;
  public isDetailToggled = false;
  public isChecked = false;

  constructor(columns: Array<Column>, itemData: Map<string, string | number | Date>) {
    this.columns = columns;
    this.itemData = itemData;
  }



}
