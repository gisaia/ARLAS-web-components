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

import { Pipe, PipeTransform } from '@angular/core';
import { CardField } from '../../components/results/model/cardField';
import { Column } from '../../components/results/model/column';

@Pipe({
  name: 'buildItemField'
})
export class BuildItemFieldPipe implements PipeTransform {

  public transform(value: Column | CardField, mode: 'table' | 'card'): string {
    if (mode === 'card' && value instanceof CardField){
      return buildCardItemField(value);
    } else if (mode === 'table' && value instanceof Column) {
      return buildTableItemField(value);
    } else {
      return '';
    }
  }
}

export function buildCardItemField(field: CardField){
  return `${field.fieldName}_${field.prettyName}_${field?.icon}_card`;
}

export function buildTableItemField(field: Column){
  return `${field.fieldName}_${field.columnName}_table`;
}
