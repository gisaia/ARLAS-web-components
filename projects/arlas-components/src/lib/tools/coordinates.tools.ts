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

import { FormControl, FormGroup, Validators } from '@angular/forms';

// eslint-disable-next-line max-len
export const DECIMAL_SEXAGESIMAL_REGEX = '^(?<decimal>[+-]?([0-9]*[.])?[0-9]+)$|^(?<degrees>(-?)[0-9]+)°[ ]*((?<minutes>[0-9]+)\'[ ]*((?<seconds>[0-9]+)\")?)?$';
export class PointFormGroup extends FormGroup {

    public latitude: FormControl;
    public longitude: FormControl;

    public constructor(initLat: number | string, initLng: number | string) {
        const coordinatesRegex = DECIMAL_SEXAGESIMAL_REGEX;
        const latitude = new FormControl(String(initLat), [
            Validators.required,
            Validators.pattern(coordinatesRegex)
        ]);
        const longitude = new FormControl(String(initLng), [
            Validators.required,
            Validators.pattern(coordinatesRegex),
        ]);
        super({
            latitude,
            longitude
        });
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

export class Coordinate {
  /** Parses a coordinate in decimal or sexagesimal degrees and returns the decimal degrees */
  public static parse(value: string) {
    const coordinatesRegex = DECIMAL_SEXAGESIMAL_REGEX;
    const parsedCoordinates = (String(value)).match(coordinatesRegex);
    if (parsedCoordinates && parsedCoordinates.groups) {
      const groups = parsedCoordinates.groups;
      if (groups.decimal) {
        return +groups.decimal;
      } else {
        const degrees = +groups.degrees;
        const minutes = +groups.minutes;
        const seconds = +groups.seconds;
        return this.dmsToDd(degrees, minutes, seconds);
      }
    }
  }

  /** DegreeMinutesSeconds to Decimal degree */
  public static dmsToDd(degrees: number, minutes: number, seconds: number) {
    const isNegative = (degrees < 0);
    if (!minutes) {
      minutes = 0;
    }
    if (!seconds) {
      seconds = 0;
    }
    const dd = Math.abs(degrees) + minutes / 60 + seconds / 3600;
    return isNegative ? -dd : dd;
  }
}
