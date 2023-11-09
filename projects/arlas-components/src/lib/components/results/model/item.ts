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

import { Action, Attachment } from '../utils/results.utils';
import { Column } from './column';

export class Item {

  /**
   * @description Item's identifier.
   */
  public identifier: string;
  /**
   * @description List of urls pointing to the item's images.
   */
  public urlImages: Array<string>;
  /**
   * @description List of descriptions of the images.
   */
  public descriptions: Array<string>;
  /**
   * @description If image is enabled (to avoid 404 not found)
   */
  public imageEnabled: boolean;
  /**
   * @description Url that links the item's thumbnail.
   */
  public urlThumbnail: string;
  /**
   * @description If thumbnail is enabled (to avoid 404 nott found)
   */
  public thumbnailEnabled: boolean;
  /**
   * @description Item's title.
   */
  public title: string;
  /**
   * @description Item's tooltip.
   */
  public tooltip: string;
  /**
   * @description The item's data is organized in this columns when represented in a table.
   */
  public columns: Array<Column>;
  /**
   * @description A fieldName-fieldValue map representing the item's data.
   */
  public itemData: Map<string, string | number | Date>;

  /**
   * @description More data organized in groups.
   */
  public itemDetailedData: Array<{
    group: string;
    details: Array<{ key: string; value: string; }>;
  }> = new Array<{
    group: string;
    details: Array<{ key: string; value: string; }>;
  }>();
  /**
     * @description Links attached to the item.
     */
  public attachments: Array<Attachment>;
  /**
   * @description List of actions that can be applied to this item.
   */
  public actions: Array<Action>;
  /**
   * @description Whether to display the detailed data.
   */
  public isDetailToggled = false;
  /**
   * @description Whether the item is checked.
   */
  public isChecked = false;
  /**
   * @description Whether the item state is indeterminated.
   */
  public isindeterminated = false;
  /**
   * @description Whether to highlight the item.
   */
  public ishighLight = undefined;
  /**
   * @description The item position in a list of items.
   */
  public position: number;
  /**
   * @description The material grid icon.
   */
  public icon: string;
  /**
   * @description The css class for material grid icon.
   */
  public iconCssClass: string;
  /**
   * @description color characterising the item
   */
  public color: string;

  public constructor(columns: Array<Column>, itemData: Map<string, string | number | Date>) {
    this.columns = columns;
    this.itemData = itemData;
  }
}
