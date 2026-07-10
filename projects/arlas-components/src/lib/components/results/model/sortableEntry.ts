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

import { CardViewEntry } from './cardViewEntry';
import {Column} from './column';


export interface SortableEntry {
  fieldName: string;
  columnName: string;
  sort?: string;
  isIdField: boolean;
  isToggleField: boolean;
}

export function toSortableEntries(fields: (Column | CardViewEntry)[]): SortableEntry[] {
 const uniqueField = new Map<string, SortableEntry>();
  fields.forEach(f =>{

    if(!uniqueField.has(f.fieldName)){
      uniqueField.set(f.fieldName, ({
        fieldName: f.fieldName,
        columnName: 'prettyName' in f ? f.prettyName : f.columnName,
        sort: f.sort,
        isIdField: f.isIdField,
        isToggleField:  'isToggleField' in f ? f.isToggleField : false
      }));
    }
  });
 return  Array.from(uniqueField.values());
}
