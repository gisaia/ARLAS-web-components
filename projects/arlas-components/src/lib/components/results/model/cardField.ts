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

export class CardField extends ResultListField {
  /** Display label for the field shown in the card entry */
  public prettyName: string;
  /** Whether this entry is the title of the card (displayed prominently) */
  public isTitle: boolean;
  /** Line number for grouping entries into rows (same lineNumber = same row) */
  public lineNumber: number;
  /** Optional Material icon name to display alongside the value */
  public icon?: string;

  public toSortableField(): SortableField {
    return ({
      fieldName: this.fieldName,
      columnName: this.prettyName,
      sort: this.sort,
      isIdField: this.isIdField,
      isToggleField:  false
    });
  }


  /**
   * @param prettyName  Display label for the card
   * @param fieldName   Key to look up the value in item.itemData
   * @param dataType    Unit or type suffix (e.g. "%", "km")
   * @param isTitle     Whether this entry is the card title
   * @param lineNumber  Row index for grouping metaData
   * @param icon        Material icon name
   * @param sort        Sort key within the row
   */
  public constructor(prettyName: string, fieldName: string, dataType: string,
                     isTitle: boolean, lineNumber: number, icon?: string, sort?: string) {
    super(fieldName, dataType, sort);
    this.prettyName = prettyName;
    this.isTitle = isTitle;
    this.lineNumber = lineNumber;
    this.icon = icon;
  }
}

