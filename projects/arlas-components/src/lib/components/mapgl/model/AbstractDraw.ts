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

export interface DrawEvents {
  onDrawCreate: (...args) => void;
  onDrawUpdate: (...args) => void;
  onDrawDelete: (...args) => void;
  onDrawOnClick: (...args) => void;
  onDrawOnStart: (...args) => void;
  onDrawOnStop: (...args) => void;
  onDrawInvalidGeometry: (...args) => void;
  onDrawEditSaveInitialFeature: (...args) => void;
  onDrawSelectionchange: (...args) => void;
  onDrawModeChange: (...args) => void;
}

export abstract class AbstractDraw implements DrawEvents {
  protected config;

  public abstract getAllFeatures():  Array<unknown>;

  public abstract onDrawCreate(args): void;

  public abstract on(event: string, func: (e) => void): void;

  public abstract onDrawDelete(args): void;

  public abstract onDrawEditSaveInitialFeature(args): void;

  public abstract onDrawInvalidGeometry(args): void;

  public abstract onDrawModeChange(args): void;

  public abstract onDrawOnClick(args): void;

  public abstract onDrawOnStart(args): void;

  public abstract onDrawOnStop(args): void;

  public abstract onDrawSelectionchange(args): void;

  public abstract onDrawUpdate(args): void;

  public abstract setMode(mode: any,  replaceMode: string): void;

}
