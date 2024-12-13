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

import { UntypedFormControl, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import tinycolor from 'tinycolor2';

export function formatNumber(x, formatChar = ' '): string {
  if (formatChar === NUMBER_FORMAT_CHAR) {
    formatChar = ' ';
  }
  if (+x + '' !== 'NaN' && typeof +x === 'number') {
    const num = +x;
    const trunc = Math.trunc(num);
    const decimal = (num + '').split('.');
    const spacedNumber = Math.abs(trunc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, formatChar);
    const spacedNumberString = trunc < 0 ? '-' + spacedNumber : spacedNumber;
    if (num < 0.09 && num > -0.09 && num !== 0) {
      return Number.parseFloat(x).toExponential(3);
    }
    return decimal.length === 2 ? spacedNumberString + '.' + decimal[1] : spacedNumberString;
  }
  return x;
}
export const NUMBER_FORMAT_CHAR = 'NUMBER_FORMAT_CHAR';

export function numberToShortValue(number: number, p?: number): string {
  // what tier? (determines SI symbol)
  const suffixes = ['', 'k', 'M', 'b', 't'];
  const suffixNum = Math.log10(Math.abs(number)) / 3 | 0;

  if (suffixNum === 0) {
    return number.toString();
  }
  // get suffix and determine scale
  const suffix = suffixes[suffixNum];
  const scale = Math.pow(10, suffixNum * 3);
  // scale the number
  const scaled = number / scale;
  // format number and add suffix
  return scaled.toFixed(p) + ' ' + suffix;
}
export const DEFAULT_SHORTENING_PRECISION = 2;

export function getKeys(map): Array<string> {
  return Array.from(map.keys());
}

export function getValues(map): Array<any> {
  return Array.from(map.values());
}

export abstract class ColorGeneratorLoader {
  public abstract keysToColors: Array<[string, string]>;
  public abstract colorsSaturationWeight: number;
  public abstract changekeysToColors$: Observable<void>;
  /**
   * This method generates a determistic color from the given key, a list of [key, color] and a saturation weight.
   * @param key The text from which the color is generated
   * @param externalkeysToColors List of [key, color] couples that associates a hex color to each key.
   * @param colorsSaturationWeight Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a factor (between 0 and 1) that
   * tightens this scale to [(1-colorsSaturationWeight), 1]. Therefore all generated colors saturation will be within this scale.
   */
  public abstract getColor(key: string, externalkeysToColors: Array<[string, string]>, externalColorsSaturationWeight: number): string;
  public abstract getTextColor(color): string;
}

export class AwcColorGeneratorLoader extends ColorGeneratorLoader {
  public changekeysToColors$: Observable<void> = new Subject<void>().asObservable();
  public keysToColors: Array<[string, string]>;
  public colorsSaturationWeight = 0.5;
  /**
   * This method generates a determistic color from the given key, a list of [key, color] and a saturation weight.
   * - First the method checks if the [key,color] is defined in externalkeysToColors and returns the correspondant color.
   *
   * - If externalkeysToColors parameter is undefined, then the method checks if the [key,color] is defined in
   * keysToColors attribute of the loader
   *
   * - If neither `externalkeysToColors` parameter nor `keysToColors` attribute are defined, then the color is generated using a determist
   * method.
   * - For this determinist method, the generated colors saturation scale can be tightened using `externalColorsSaturationWeight` parameter
   * - If the parameter `externalColorsSaturationWeight` is undefined, the attribute `colorsSaturationWeight` is used instead.
   * @param key The text from which the color is generated
   * @param externalkeysToColors List of [key, color] couples that associates a hex color to each key.
   * @param colorsSaturationWeight Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a factor (between 0 and 1) that
   * tightens this scale to [(1-colorsSaturationWeight), 1]. Therefore all generated colors saturation will be within this scale.
   */
  public getColor(key: string, externalKeysToColors: Array<[string, string]>, externalColorsSaturationWeight: number): string {
    let colorHex = null;
    const keysToColors = externalKeysToColors ? externalKeysToColors : this.keysToColors;
    const saturationWeight = (externalColorsSaturationWeight !== undefined && externalColorsSaturationWeight !== null) ?
      externalColorsSaturationWeight : this.colorsSaturationWeight;
    if (keysToColors) {
      for (let i = 0; i < keysToColors.length; i++) {
        const keyToColor = keysToColors[i];
        if (keyToColor[0] === key) {
          colorHex = keyToColor[1];
          break;
        }
      }
      if (!colorHex) {
        colorHex = this.getHexColor(key, saturationWeight);
      }
    } else {
      colorHex = this.getHexColor(key, saturationWeight);
    }
    return colorHex;
  }

  public getTextColor(color): string {
    return '#000000';
  }

  private getHexColor(key: string, saturationWeight: number): string {
    const text = key + ':' + key;
    // string to int
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    // int to rgb
    let hex = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    hex = '00000'.substring(0, 6 - hex.length) + hex;
    const color = tinycolor.mix(hex, hex);
    color.saturate(color.toHsv().s * saturationWeight + ((1 - saturationWeight) * 100));
    return color.toHexString();
  }
}

export class SelectFormControl extends UntypedFormControl {

  // used only for autocomplete: list of filtered options
  public filteredOptions: Array<string>;
  public syncOptions: Array<string> = [];

  public constructor(
    formState: any,
    label: string,
    options: Array<string>) {

    super(formState, Validators.required);
    this.setValue(formState);
    this.setSyncOptions(options);

  }

  public setSyncOptions(newOptions: Array<string>) {
    this.syncOptions = newOptions;
    this.filteredOptions = newOptions;
  }
}
const ARLAS_ID = 'arlas_id:';

/** FROM V15.0.0 layer ids look like 'arlas_id:NAME:timestamp
   * This pipe extracts the 'NAME' in that id
   */
export function getLayerName(id: string): string {
  if (!!id && id.startsWith(ARLAS_ID)) {
    const datedName = id.split(ARLAS_ID)[1];
    const undatedName = datedName.split(':')[0];
    return undatedName;
  }
  return id;
}
