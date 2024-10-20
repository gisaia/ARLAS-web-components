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

import { Component, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Item } from '../model/item';
import { Action, ActionHandler } from '../utils/results.utils';
import { Subject } from 'rxjs';

@Component({
  selector: 'arlas-result-actions',
  templateUrl: './result-actions.component.html',
  styleUrls: ['./result-actions.component.scss']
})
export class ResultActionsComponent implements OnInit, OnChanges {

  @Input() public item: Item;
  @Input() public width: number;
  @Input() public actions: Action[];
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();
  @Output() public actionOnItemEvent: Subject<Action> = new Subject<Action>();

  public ngOnInit(): void {
    this.actions = this.item.actions;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.activatedActionsPerItem) {
      const actionIds = this.activatedActionsPerItem.get(this.item.identifier);
      if (actionIds) {
        this.actions.forEach(a => {
          if (actionIds.has(a.id)) {
            ActionHandler.activate(a);
          }
        });
        /** Retrigger ActionDisplayerMap */
        this.actions = [...this.actions];
      }
    }
  }

  public triggerAction(action: Action) {
    this.actionOnItemEvent.next(action);
    if (ActionHandler.isReversible(action)) {
      console.log(action);
      console.log('was activated?', action.activated);
    }
    if (ActionHandler.isReversible(action) && !action.activated) {
      ActionHandler.activate(action);
    } else if (ActionHandler.isReversible(action) && action.activated) {
      ActionHandler.reverse(action);
    }
    /** Retrigger ActionDisplayerMap */
    this.actions = [...this.actions];
  }
}
