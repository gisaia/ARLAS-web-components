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

import { Observable } from 'rxjs';
import { Item } from '../model/item';
import { Action, ActionFilter, AdditionalInfo, ItemDataType } from '../utils/results.utils';
import { Task } from './aias-process';

export interface FieldDetail {
  path: string;
  label: string;
  process: string;
}

export interface Detail {
  name: string;
  order: number;
  fields: Array<FieldDetail>;
}
export interface MatchInfo {
  matched: Array<boolean>;
  data: Record<string, ItemDataType>;
}


export interface DetailedDataRetriever {

  detailsConfig: Array<Detail>;

  getValues(identifier: string, fields: string[]): Observable<string[]>;

  getData(identifier: string): Observable<AdditionalInfo>;

  getActions(item: Item): Observable<Array<Action>>;

  getMatch(identifier: string, filters: ActionFilter[][]): Observable<MatchInfo>;

  /** Retrieves the tasks associated to an item for all services */
  getAllTasks(identifier: string): Map<string, Observable<Task[]>>;

  /** Retrieves the tasks associated to an item for one service */
  getServiceTasks(identifier: string, service: string): Observable<Task[]>;
}
