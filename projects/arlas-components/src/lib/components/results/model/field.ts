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
 * Should be iso with the fieldList of ResultListContributor fieldList attribute.
 * Describes a Field used to display data in the Resultlist table
 */
export interface Field {
  /** Name/path of the field to add to list **/
  fieldName: string;
  /**  Name of the field that will be displayed on the list column **/
  columnName: string;
  /** Unit of the field values if it exists (degree, percentage, etc) **/
  dataType: string;
  /** Whether to colorize values on cells of the list with a color generated from the field value **/
  useColorService?: boolean;
  /** Whether the field represents a hybrid field **/
  isHybrid?: boolean;
  /** If this field is an hybrid title **/
  isHybridTitle?: boolean;
  /** Whether to display an icon or note **/
  icon?: string;
};
