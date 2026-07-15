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
import {SortableField} from './sortableField';

export abstract class ResultListField {

  /**
   * @description The name of the field related to this column.
   */
  public fieldName: string;
  /**
   * @description Type of data that is appended to column name : %, °C, ..
   */
  public dataType: string;

  /**
   * @description Sort direction to apply to th column : ascending, descending or none
   */
  public sortDirection: SortEnum = SortEnum.none;
  /**
   * @description Whether this column represents an id field.
   */
  public isIdField = false;

  /**
   * @description  Internal field created by the builder for both configuration to determine default sort
   */
  public sort: string;

  public abstract toSortableField(): SortableField;



  public constructor(fieldName: string, dataType: string, sort?: string) {
    this.fieldName = fieldName;
    this.dataType = dataType;
    this.sort  = sort;
  }
}

