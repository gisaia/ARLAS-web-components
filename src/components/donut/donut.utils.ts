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

import { ColorGenerator } from 'arlas-d3';
import * as tinycolor from 'tinycolor2';

export class ColorGeneratorImpl implements ColorGenerator {
  public keysToColors: Array<Array<string>>;
  public saturationWeight: number;

  public getColor(key: string): string {
    let colorHex = null;
    if (this.keysToColors) {
      for (let i = 0; i < this.keysToColors.length; i++) {
        const keyToColor = this.keysToColors[i];
        if (keyToColor[0] === key) {
          colorHex = keyToColor[1];
          break;
        }
      }
      if (!colorHex) {
        colorHex = this.getHexColor(key);
      }

    } else {
      colorHex = this.getHexColor(key);
    }
    return colorHex;
  }

  private getHexColor(key: string): string {
    const text = key + ':' + key;
      // string to int
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
      }
      // int to rgb
      let hex = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      hex =  '00000'.substring(0, 6 - hex.length) + hex;
      const color = tinycolor(hex);
      color.saturate(color.toHsv().s * this.saturationWeight + ((1 - this.saturationWeight) * 100));
      return color.toHexString();
  }
}
