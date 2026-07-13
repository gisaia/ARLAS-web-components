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

import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {ItemDataType} from '../utils/results.utils';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {NUMBER_FORMAT_CHAR} from '../../componentsUtils';
import {FormatNumberPipe} from '../../../pipes/format-number/format-number.pipe';
export interface MetaBadge {
  /** The value to display in the badge */
  value: ItemDataType;
  /** Optional icon to display alongside the value */
  icon?: string;
  /** Optional unit/dataType suffix (e.g., '%', '°C') */
  unit?: string;
  /** Optional tooltip text for hover */
  tooltip?: string;
}

@Component({
  selector: 'arlas-card-result-item-metadata-entry',
  imports: [
    MatIcon,
    MatTooltip,
    FormatNumberPipe
  ],
  templateUrl: './card-result-item-metadata-entry.component.html',
  styleUrl: './card-result-item-metadata-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardResultItemMetadataEntryComponent {
  /** Default text to display when no value is available */
  protected readonly NO_VALUE = '-';
  /** The badge data to display (required input) */
  public metadataEntry = input.required<MetaBadge>();

  /** Whether the value is empty **/
  public valueIsEmpty = computed(() => {
    if(this.metadataEntry().value === undefined || this.metadataEntry().value === null){
      return true;
    }

    if(typeof this.metadataEntry().value === 'string' &&
      ((this.metadataEntry().value as string).trim().length === 0 ||
      (this.metadataEntry().value as string).trim() === this.NO_VALUE)){
      return true;
    }

    if(typeof this.metadataEntry().value === 'number' &&
      Number.isNaN(this.metadataEntry().value as number)){
      return true;
    }

    return false;
  });
  protected readonly NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;
}
