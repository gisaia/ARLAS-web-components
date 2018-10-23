import { Column } from './column';
import { Action, FieldsConfiguration } from '../utils/results.utils';

import { Subject } from 'rxjs';

export class Item {

  /**
   * @description Item's identifier.
   */
  public identifier: string;
  /**
   * @description Url that links the item's image.
   */
  public urlImage: string;
  /**
   * @description If image is enabled (to avoid 404 nott found)
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
    group: string,
    details: Array<{ key: string, value: string }>
  }> = new Array<{
    group: string,
    details: Array<{ key: string, value: string}>
  }>();
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
  public ishighLight = false;
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

  constructor(columns: Array<Column>, itemData: Map<string, string | number | Date>) {
    this.columns = columns;
    this.itemData = itemData;
  }



}
