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


  public constructor() {}
}

export interface Action {
  id: string;
  label: string;
  actionBus?: Subject<{ idFieldName: string; idValue: string; }>;
  cssClass?: string | string[];
  tooltip?: string;
}

export interface ElementIdentifier {
  idFieldName: string;
  idValue: string;
}

export interface FieldsConfiguration {
  idFieldName: string;
  /**
   * @deprecated
   */
  urlImageTemplate?: string;
  urlImageTemplates?: Array<DescribedUrl>;
  urlThumbnailTemplate?: string;
  titleFieldNames?: Array<Field>;
  tooltipFieldNames?: Array<Field>;
  useHttpQuicklooks?: boolean;

  /**
   * @deprecated
   */
  icon?: string;
  iconCssClass?: string;
  iconColorFieldName?: string;
}

export interface DescribedUrl {
  url: string;
  description: string;
  filter?: FieldFilter;
}

export interface FieldFilter {
  field: string;
  values: Array<string>;
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

export const QUICKLOOK_HEADER = 'Quicklook-Call';

/**
 * @param data A dictionnary of data to retrieve information
 * @param template The template of the desired string. Contains variable keys between brackets
 * @returns A string with the regex replaced by the data
 */
export function matchAndReplace(data: Map<string, string | number | Date>, template: string) {
  let replaced = template;
  template.match(/{(.+?)}/g)?.forEach(t => {
    const key: string = t.replace('{', '').replace('}', '');
    replaced = replaced.replace(t, data.get(key).toString());
  });
  return replaced;
}
