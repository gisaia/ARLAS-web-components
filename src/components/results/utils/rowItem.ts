import {Column} from './column';
import { Subject } from 'rxjs/Subject';

export class RowItem {

  public columns: Array<Column>;
  public identifier: string;
  public data: Map<string, string | number | Date>;
  public detailedData: Array<{key: string, value: string}> = new Array<{key: string, value: string}>();
  public actions: Array<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>;
  public isDetailToggled = false;

  constructor(columns: Array<Column>, rowData: Map<string, string | number | Date> ) {
    this.columns = columns;
    this.data = rowData;
  }


}
