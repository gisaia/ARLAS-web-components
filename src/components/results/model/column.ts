import { SortEnum } from '../utils/enumerations/sortEnum';


export class Column {
  /**
   * @description The column name
   */
  public columnName: string;
  /**
   * @description The name of the field related to this column.
   */
  public fieldName: string;
  /**
   * @description Type of data that is appended to column name : %, °C, ..
   */
  public dataType: string;
  /**
   * @description Width of the column.
   */
  public width: number;
  /**
   * @description Sort direction to apply to th column : ascending, descending or none
   */
  public sortDirection: SortEnum = SortEnum.none;
  /**
   * @description Whether this column represents an id field.
   */
  public isIdField = false;
  /**
   * @description Whether the cells of this column contains a toggle button.
   */
  public isToggleField = false;

  constructor(columnName: string, fieldName: string, dataType: string ) {
    this.columnName = columnName;
    this.fieldName = fieldName;
    this.dataType = dataType;
  }

}
