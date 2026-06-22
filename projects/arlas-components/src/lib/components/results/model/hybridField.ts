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

/**
 *  Proposal. Not definitive way to do it.
 *  Maybe we can keep column and enrich directly the Column class with the hybrid field properties ?
 *  But for now, we keep it separate
 */
export class HybridField {
  /**
   * @description The name of the field related to this column.
   */
  public prettyName: string;
  /**
   * @description The name of the field related to this column.
   */
  public fieldName: string;
  /**
   * @description Type of data that is appended to column name : %, °C, ..
   */
  public dataType: string;

  /**
   * @description Whether this column represents an id field.
   */
  public isIdField = false;

  public isTitle = false;

  public icon = '';


  public constructor(prettyName: string, fieldName: string, dataType: string, isTitle = false, icon?: string) {
    this.prettyName = prettyName;
    this.fieldName = fieldName;
    this.dataType = dataType;
    this.isTitle = isTitle;
    this.icon = icon;
  }
}

