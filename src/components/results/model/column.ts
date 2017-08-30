import { SortEnum } from '../utils/enumerations/sortEnum';


export class Column {

  public columnName: string;
  public fieldName: string;
  public dataType: string;
  public width: number;
  public sortDirection: SortEnum = SortEnum.none;
  public isIdField = false;
  public isToggleField = false;

  constructor(columnName: string, fieldName: string, dataType: string ) {
    this.columnName = columnName;
    this.fieldName = fieldName;
    this.dataType = dataType;
  }

}
