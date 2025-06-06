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
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResultlistNotifierService {

  private readonly itemHoveredSource = new Subject<string>();
  public itemHovered$ = this.itemHoveredSource.asObservable();

  private readonly refreshActionsSource = new Subject<string>();
  /** Emits an event every time the actions of the items are to be refreshed.
   * Emits the id of the item taht triggered the event.  */
  public refreshActions$ = this.refreshActionsSource.asObservable();

  public notifyItemHover(id: string) {
    this.itemHoveredSource.next(id);
  }

  public refreshActions(id?: string) {
    this.refreshActionsSource.next(id);
  }
}
