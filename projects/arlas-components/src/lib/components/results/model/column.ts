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

import {ResultListField} from './resultListField';
import {SortableField} from './sortableField';

export class Column  extends ResultListField {
  /**
   * @description The column name
   */
  public columnName: string;

  public width: number;

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

  /** Whether the column can be resized */
  public get isResizable() {
    return !this.isIdField && !this.isToggleField;
  }

  public toSortableField(): SortableField {
    return ({
      fieldName: this.fieldName,
      columnName: this.columnName,
      sort: this.sort,
      isIdField: this.isIdField,
      isToggleField:  this.isToggleField
    });
  }

  public constructor(columnName: string, fieldName: string, dataType: string) {
    super(fieldName, dataType);
    this.columnName = columnName;
  }
}

