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


export interface OnMoveResult {
  zoom: number;
  zoomStart: number;
  center: Array<number>;
  centerWithOffset: Array<number>;
  extend: Array<number>;
  extendWithOffset: Array<number>;
  rawExtendWithOffset: Array<number>;
  extendForLoad: Array<number>;
  extendForTest: Array<number>;
  rawExtendForLoad: Array<number>;
  rawExtendForTest: Array<number>;
  xMoveRatio: number;
  yMoveRatio: number;
  visibleLayers: Set<string>;
}

export class ArlasLngLat {
  public lng: number;
  public lat: number;

  public constructor(lng, lat) {
    this.lng = lng;
    this.lat = lat;
  }

  public toArray(): number[] {
    return [this.lng, this.lat];
  }
}

export class ArlasLngLatBounds {
  public sw: ArlasLngLat;
  public ne: ArlasLngLat;

  public constructor(sw: ArlasLngLat, ne: ArlasLngLat) {
    this.sw = sw;
    this.ne = ne;
  }

  public getEast() {
    return this.ne.lng;
  }

  public getNorth() {
    return this.ne.lat;
  }

  public getWest() {
    return this.sw.lng;
  }

  public getSouth() {
    return this.sw.lat;
  }
}

