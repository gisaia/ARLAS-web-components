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

import { LowerCasePipe } from '@angular/common';
import { Component, input, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { FormatNumberPipe } from '../../../pipes/format-number/format-number.pipe';
import { GetAttachmentUrlPipe } from '../../../pipes/get-attachment-url/get-attachment-url.pipe';
import { ReplacePipe } from '../../../pipes/replace/replace.pipe';
import { NUMBER_FORMAT_CHAR } from '../../componentsUtils';
import { Item } from '../model/item';
import { ResultActionsComponent } from '../result-actions/result-actions.component';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, Attachment, ElementIdentifier } from '../utils/results.utils';

@Component({
  selector: '[arlas-result-detailed-item]',
  templateUrl: './result-detailed-item.component.html',
  styleUrls: ['./result-detailed-item.component.scss'],
  imports: [ResultActionsComponent, MatTooltip, MatIcon, LowerCasePipe, TranslatePipe, FormatNumberPipe, ReplacePipe, GetAttachmentUrlPipe]
})
export class ResultDetailedItemComponent {
  /**
   * @Input
   * @description Number of columns in the parent table so that this component occupies the entire line.
   */
  @Input() public detailColspan: number;
  /**
   * @Input
   * @description Name of the id field.
   */
  @Input() public idFieldName: string;


  @Input() public containerType: string;

  /**
   * @Input
   * @description An object representing an Item and that contains the detailed data.
   */
  @Input({ required: true }) public rowItem: Item;

  /**
   * @Input
   * @description Whether display group with no detail.
   */
  @Input() public showEmptyGroup = false;

  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent: Subject<{ action: Action; elementidentifier: ElementIdentifier; }> =
    new Subject<{ action: Action; elementidentifier: ElementIdentifier; }>();

    /**
   * @Input
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  @Input({ required: true }) public detailedDataRetriever: DetailedDataRetriever;
  /**
   * @Input : Angular
   * @description List of active actions per item.
  */
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();

  /**
   * Whether to make the actions 'sticky' and to always show them in the details
   */
  public alwaysShowActions = input<boolean>(false);

  public NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;

  public constructor(private readonly translate: TranslateService) { }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.next({ action: action, elementidentifier: { idFieldName: this.idFieldName, idValue: this.rowItem.identifier } });
  }

  public getGroups() {
    return (this.showEmptyGroup) ? (this.rowItem?.itemDetailedData) : (this.rowItem?.itemDetailedData.filter(d => d.details.length > 0));
  }

  public getAttachmentLabel(attachment: Attachment, index: number): string {
    if (attachment.label && attachment.label.length > 0) {
      return attachment.label;
    } else {
      return this.translate.instant('Link') + ' ' + index;
    }
  }

  public getAttachmentDescription(attachment: Attachment): string {
    if (attachment.description && attachment.description.length > 0) {
      return attachment.description;
    } else {
      return attachment.url;
    }
  }
}
