/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

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
  /**
   * @description Whether the filter search column has a dropdown.
   */
  public dropdown = false;
  /**
   * @description Size of the dropdown list.
   */
  public dropdownsize = 10;
  /**
   * @description Whether to allow colorizing cells that are within this column
   */
  public useColorService = false;

  constructor(columnName: string, fieldName: string, dataType: string ) {
    this.columnName = columnName;
    this.fieldName = fieldName;
    this.dataType = dataType;
  }

}
