import { SortEnum } from '../results.utils';


export class Column {

  public columnName: string;
  public fieldName: string;
  public dataType: string;
  public width: number;
  public sortDirection: SortEnum;
  public isIdField = false;

  constructor(columnName: string, fieldName: string, dataType: string ) {
    this.columnName = columnName;
    this.fieldName = fieldName;
    this.dataType = dataType;
  }

}
