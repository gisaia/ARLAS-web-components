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

const getReqObjectUrl = (loadFn, rawUrl, type, collectResourceTiming, transformRequestFunction) => new Promise((res, rej) => {
  const requestParameters: any = {
    url: rawUrl,
    type: (type ==='vector' || type === 'raster') ? 'arrayBuffer' : 'string',
    collectResourceTiming: collectResourceTiming
  };
  if (type === 'raster') {
    requestParameters.headers = {
      accept: 'image/webp,*/*',
    };
  } else {
    requestParameters.headers = {
      'Content-Encoding': 'gzip'
    };
  }
  if (!!transformRequestFunction) {
    const customHeaders = transformRequestFunction(rawUrl, 'Tile').headers;
    if (!!customHeaders) {
      for (const [key, value] of Object.entries(customHeaders)) {
        requestParameters.headers[key] = value;
      }
    }
  }
  const urlCallback = (error, data, cacheControl, expires) => {
    if (error) {
      rej(error);
    } else {
      let preparedData;
      if (data instanceof Uint8Array) {
        preparedData = new Uint8Array(data);
      } else {
        preparedData = JSON.stringify(data);
      }
      const blob = new Blob([preparedData]);
      const url = URL.createObjectURL(blob);
      res(url);
    }
  };
  loadFn(requestParameters, urlCallback);
});
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CustomProtocol = (mapLibrary) => {
  // Adds the protocol tools to the mapLibrary, doesn't overwrite them if they already exist
  const alreadySupported = mapLibrary.addProtocol !== undefined && mapLibrary._protocols === undefined;
  if (!alreadySupported) {
    mapLibrary._protocols = mapLibrary._protocols || new Map();
    mapLibrary.addProtocol = mapLibrary.addProtocol || ((customProtocol, loadFn) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let _a;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
      (_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.set(customProtocol, loadFn);
    });
    mapLibrary.removeProtocol = mapLibrary.removeProtocol || ((customProtocol) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let _a;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
      (_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.delete(customProtocol);
    });
  }
  return {
    'vector': class VectorCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('vector') {
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      constructor() {
        super(...arguments);
      }
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      loadTile(tile, callback) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let _a, _b;
        const rawUrl = tile.tileID.canonical.url(this.tiles, this.scheme);
        const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
        if (!alreadySupported && ((_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.has(protocol))) {
          const loadFn = (_b = mapLibrary._protocols) === null || _b === void 0 ? void 0 : _b.get(protocol);
          getReqObjectUrl(loadFn, rawUrl, this.type, this._collectResourceTiming,
            this.map._requestManager._transformRequestFn.bind(this)).then((url: string) => {
              tile.tileID.canonical.url = function () {
                delete tile.tileID.canonical.url;
                return url;
              };
              super.loadTile(tile, function () {
                URL.revokeObjectURL(url);
                callback(...arguments);
              });
            }).catch((e) => {
              console.error('Error loading tile', e.message);
              throw e;
            });
        } else {
          super.loadTile(tile, callback);
        }
      }
    },
    'raster': class RasterCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('raster') {
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      constructor() {
        super(...arguments);
      }
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      loadTile(tile, callback) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let _c, _d;
        const rawUrl = tile.tileID.canonical.url(this.tiles, this.scheme);
        const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
        if (!alreadySupported && ((_c = mapLibrary._protocols) === null || _c === void 0 ? void 0 : _c.has(protocol))) {
          const loadFn = (_d = mapLibrary._protocols) === null || _d === void 0 ? void 0 : _d.get(protocol);
          getReqObjectUrl(loadFn, rawUrl, this.type, this._collectResourceTiming,
            this.map._requestManager._transformRequestFn.bind(this)).then((url: string) => {
              tile.tileID.canonical.url = function () {
                delete tile.tileID.canonical.url;
                return url;
              };
              super.loadTile(tile, function () {
                URL.revokeObjectURL(url);
                callback(...arguments);
              });
            }).catch((e) => {
              console.error('Error loading tile', e.message);
              throw e;
            });
        } else {
          super.loadTile(tile, callback);
        }
      }
    },
    'geojson': class GeoJSONCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('geojson') {
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      constructor() {
        super(...arguments);
        this.type = 'geojson';
      }
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      _updateWorkerData(callback) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let _a, _b;
        const that = this;
        const data = that._data;
        const done = (url) => {
          super._updateWorkerData(function () {
            if (url !== undefined) {
              URL.revokeObjectURL(url);
            }
            callback(...arguments);
          });
        };
        if (typeof data === 'string') {
          const protocol = data.substring(0, data.indexOf('://'));
          if (!alreadySupported && ((_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.has(protocol))) {
            const loadFn = (_b = mapLibrary._protocols) === null || _b === void 0 ? void 0 : _b.get(protocol);
            getReqObjectUrl(loadFn, data, this.type, this._collectResourceTiming,
              this.map._requestManager._transformRequestFn.bind(this)).then((url) => {
                that._data = url;
                done(url);
              });
          } else {
            // Use the build in code
            done(undefined);
          }
        } else {
          // If data is already GeoJSON, then pass it through
          done(undefined);
        }
      }
    }
  };
};
