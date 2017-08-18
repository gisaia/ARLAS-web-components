import {Column} from './column';

export class RowItem {

  public columns: Array<Column>;
  public data: Map<string, string | number | Date>;

  constructor(columns: Array<Column>, rowData: Map<string, string | number | Date> ) {
    this.columns = columns;
    this.data = rowData;
  }


}
