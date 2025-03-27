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
}

/**
 * Possible operations on field values based on string or numerical fields
 */
export enum Operations {
  Eq,
  Gte,
  Gt,
  Lte,
  Lt,
  Like,
  Ne,
  Range
}

export interface ActionFilter {
  field: string;
  op: Operations;
  value: string;
}

export interface Action {
  id: string;
  label: string;
  actionBus?: Subject<{ idFieldName: string; idValue: string; }>;
  cssClass?: string | string[];
  tooltip?: string;
  /** An action might need a reverse action to go back to an original state.
   * For instance: add layer to map => reverse => remove layer from map.*/
  reverseAction?: Action;
  /** if activated, the action is always displayed (not only on hover). */
  activated?: boolean;
  /** An Angular icon name to be used to display the icon button of the action. */
  icon?: string;
  /** If this attribute is set, it means that this action needs these fields values in order to be accomplished.
   * If those fields values don't exist for an item, then the action could not be completed and therefore should be hidden. */
  fields?: string[];
  /** If this attribute is set, it means that this action needs for the conditions described to be true in order to be accomplished.
   * Each list of the filters are joined by OR whereas each element of each list is joined by AND.
   * If the conditions are not met, then the action could not be completed and therefore should be hidden. */
  filters?: Array<Array<ActionFilter>>;
  /** Indicates what array of filters has been matched based on the queries made */
  matched?: Array<boolean>;
  /** Calculated attribute that tells if the action should be shown or not. */
  show?: boolean;
  /** For global actions, even if no item is selected, the action will be enabled */
  alwaysEnabled?: boolean;
}

/** A utility class to handle the action's states  */
export class ActionHandler {
  /** An action is reversible simply when a reverse action is declared. */
  public static isReversible(a: Action): boolean {
    return !!a && !!a.reverseAction;
  }

  public static activate(a: Action): void {
    a.activated = true;
  }

  public static reverse(a: Action): void {
    a.activated = false;
  }
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
  useHttpThumbnails?: boolean;
  /**
   * @deprecated
   */
  icon?: string;
  iconCssClass?: string;
  iconColorFieldName?: string;
  detailsTitleTemplate?: string;
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
  reference: Map<string, ItemDataType>;
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

export type ItemDataType = string | number | Date | Array<string>;

export const PROTECTED_IMAGE_HEADER = 'Protected-Image-Header';

/**
 * @param data A dictionnary of data to retrieve information
 * @param template The template of the desired string. Contains variable keys between brackets
 * @returns A string with the regex replaced by the data
 */
export function matchAndReplace(data: Map<string, ItemDataType>, template: string) {
  let replaced = template;
  template.match(/{(.+?)}/g)?.forEach(t => {
    const key: string = t.replace('{', '').replace('}', '');
    if (data.get(key)) {
      replaced = replaced.replace(t, data.get(key).toString());
    }
  });
  return replaced;
}
