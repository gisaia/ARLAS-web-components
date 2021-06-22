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

import { Subject } from 'rxjs';
import { PageEnum } from './enumerations/pageEnum';

/**
 * Enables customize the resultlist options/behaviours
 */
export class ResultListOptions {
  public showActionsOnhover = false;
  public showDetailIconName = 'add_circle_outline';
  public hideDetailIconName = 'remove_circle_outline';
  public defautlImgUrl = './assets/no-view.png';


  constructor() {}
}

export interface Action {
  id: string;
  label: string;
  actionBus?: Subject<{ idFieldName: string, idValue: string }>;
  cssClass?: string | string[];
  tooltip?: string;
}

export interface ElementIdentifier {
  idFieldName: string;
  idValue: string;
}

export interface FieldsConfiguration {
  idFieldName: string;
  urlImageTemplate?: string;
  urlThumbnailTemplate?: string;
  titleFieldNames?: Array<Field>;
  tooltipFieldNames?: Array<Field>;
  icon?: string;
  iconCssClass?: string;
  iconColorFieldName?: string;
}

export interface Field {
  fieldPath: string;
  process?: string;
}

export interface PageQuery {
  reference: Map<string, string | number | Date>;
  whichPage: PageEnum;
}

export interface Attachment {
  label?: string;
  url: string;
  type?: string;
  description?: string;
  icon?: string;
}

export interface AdditionalInfo {
  details?: Map<string, Map<string, string>>;
  actions?: Array<Action>;
  attachments?: Array<Attachment>;
}
