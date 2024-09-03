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

import { Injectable } from '@angular/core';

export abstract class BaseCollectionService {
  protected abstract _initUnits(): void;
  protected abstract _initDisplayNames(): void;
  public abstract getDisplayName(collectionName: string): string;
  public abstract getUnit(collectionName: string): string;
  public abstract getAllUnits(): string[];
}

export class AwcCollectionService extends BaseCollectionService {
  public getAllUnits(): string[] {
    return [];
  }
  protected _initUnits() { }
  protected _initDisplayNames() { }

  public getDisplayName(collectionName: string): string {
    return collectionName;
  }
  public getUnit(collectionName: string): string {
    return collectionName;
  }
}


@Injectable({
  providedIn: 'root'
})
export class CollectionService {

  public constructor(private baseCollectionService: BaseCollectionService) {
  }
  public getDisplayName(collectionName: string): string {
    return this.baseCollectionService.getDisplayName(collectionName);
  };
  public getUnit(collectionName: string): string {
    return this.baseCollectionService.getUnit(collectionName);
  };

  public getAllUnits() {
    return this.baseCollectionService.getAllUnits();
  }

}



