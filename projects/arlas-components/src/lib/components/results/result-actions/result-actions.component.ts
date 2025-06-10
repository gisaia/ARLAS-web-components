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

import { Component, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { filter, Subject, take, takeUntil } from 'rxjs';
import { ResultlistNotifierService } from '../../../services/resultlist.notifier.service';
import { Item } from '../model/item';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, ActionHandler } from '../utils/results.utils';


/**
 * This component displays actions of an item.
 * - Actions are only displayed when we hover an item.
 * BUT
 * An action can be reversible. It means that this action has a reverse action.
 * - An example of reversible action:  Action => Add layer to map --///--  Reverse Action => Remove layer from map.
 * - When you click on a reversible action for the first time, the action become 'activated'.
 * - Activated actions should be displayed all the time on the resultlist (in list and grid view).
 * - When you click on an 'activated' action, the action is reversed and goes back to its initial state.
 * - Actions that are not activated are only displayed when we hover an item.
 * ALSO
 * When a reversible action has `fields` attribute. It means that this action needs the existence of the fields values in order to be executed.
 * - If one of the fields values is absent in the current item, the action will be hidden.
 */
@Component({
  selector: 'arlas-result-actions',
  templateUrl: './result-actions.component.html',
  styleUrls: ['./result-actions.component.scss']
})
export class ResultActionsComponent implements OnInit, OnChanges, OnDestroy {
  /** The item which actions are managed by this component. */
  @Input() public item: Item;
  /** Width of the component. */
  @Input() public width: number;
  /** Map <itemId, Set<actionIds>> : for each item, gives the list of activated actions. */
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();
  /** This data retriever allows to fetch the actions of each items + check if an action should be hidden. */
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;
  /** Whether to stop propagation at click/hover of the action. */
  @Input() public stopPropagation = false;
  /** Whether to display the actions as icon buttons or text buttons. */
  @Input() public mode: 'icon' | 'text' = 'icon';

  /** Emits an event when the action is clicked on it. */
  @Output() public actionOnItemEvent: Subject<Action> = new Subject<Action>();

  /** Destroy subscriptions. */
  private readonly _onDestroy$ = new Subject<boolean>();

  public actions: Action[];

  public constructor(private readonly notifier: ResultlistNotifierService) {
    /** When an Item is hovered: */
    this.notifier.itemHovered$.pipe(takeUntil(this._onDestroy$)).pipe(filter(id => id === this.item.identifier)).subscribe({
      next: id => {
        this.onItemHovered();
      }
    });

    /** When actions need to be refreshed */
    this.notifier.refreshActions$.pipe(takeUntil(this._onDestroy$), filter(v => !v || v !== this.item.identifier)).subscribe({
      next: () => {
        this.onRefreshActions();
      }
    });
  }

  public ngOnInit(): void {
    this.setItemActions(this.item);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.activatedActionsPerItem) {
      this.updateActions();
    }
  }

  /**
   * An action can be reversible. It means that this action has a reverse action.
   * - When you click on a reversible action for the first time, the action become 'activated'.
   * - Activated actions should be displayed all the time on the resultlist (in list and grid view).
   * - When you click on an 'activated' action, the action is reversed and goes back to its initial state.
   */
  public triggerAction(event: Event, action: Action) {
    if (this.stopPropagation) {
      event.stopPropagation();
    }
    this.actionOnItemEvent.next(action);
    /** activate */
    if (ActionHandler.isReversible(action) && !action.activated) {
      ActionHandler.activate(action);
    } else if (ActionHandler.isReversible(action) && action.activated) {
      ActionHandler.reverse(action);
    }
    /** Retrigger the pipe ActionDisplayerPipe */
    this.actions = [...this.actions];
  }

  /**
   * An action can be reversible. It means that this action has a reverse action.
   * - When you click on a reversible action for the first time, the action become 'activated'.
   * - Activated actions should be displayed all the time on the resultlist (in list and grid view).
   * - When you click on an 'activated' action, the action is reversed and goes back to its initial state.
   */
  private updateActions() {
    if (this.activatedActionsPerItem) {
      const actionIds = this.activatedActionsPerItem.get(this.item.identifier);
      if (!!actionIds && !!this.actions) {
        this.actions.filter(a => ActionHandler.isReversible(a)).forEach(a => {
          if (actionIds.has(a.id)) {
            ActionHandler.activate(a);
            /** Always show activated actions. */
            a.show = true;
          } else {
            ActionHandler.reverse(a);
          }
        });
        /** Retrigger ActionDisplayerPipe */
        this.actions = [...this.actions];
      }
    }
  }

  /**
   * @description set the list of actions of an item
   * @param item
   */
  private setItemActions(item: Item): void {
    if (item && (!item.actions || (item.actions && item.actions.length === 0))) {
      item.actions = new Array<Action>();
      this.detailedDataRetriever.getActions(item).pipe(take(1)).subscribe(actions => {
        actions.forEach(action => {
          item.actions.push({
            id: action.id,
            label: action.label,
            actionBus: action.actionBus,
            cssClass: action.cssClass,
            tooltip: action.tooltip,
            reverseAction: action.reverseAction,
            icon: action.icon,
            fields: action.fields,
            filters: action.filters,
            show: action.show
          });
        });
        this.actions = item.actions;
        this.updateActions();
      });
    } else if (item?.actions?.length > 0) {
      this.actions = item.actions;
      this.updateActions();
    }
  }

  /**
   * Update the visibility of actions after the item has been hovered
   */
  private onItemHovered() {
    /** Always show non reversible actions. */
    this.actions.filter(a => !ActionHandler.isReversible(a)).forEach(a => a.show = true);
    /** We check if reversible actions has 'fields'.
     * - If one of the fields values is absent in the current item, the action will be hidden. */
    this.actions.filter(a => ActionHandler.isReversible(a) && a.show === undefined).forEach(a => {
      if (a.fields) {
        this.detailedDataRetriever.getValues(this.item.identifier, a.fields).pipe(
          take(1)).subscribe(values => a.show = values.filter(v => !v).length === 0);
      } else if (a.filters) {
        this.detailedDataRetriever.getMatch(this.item.identifier, a.filters).pipe(
          take(1)).subscribe(v => {
            if (a.filters.length === v.matched.length) {
              a.matched = v.matched;
              a.show = v.matched.filter(v => v).length > 0;
            } else {
              a.show = false;
            }
        });
      }
    });
  }

  /**
   * Resets the filters and visibility of the actions
   */
  private onRefreshActions() {
    this.detailedDataRetriever.getActions(this.item).pipe(take(1)).subscribe(actions => {
      actions.forEach(a => {
        const action = this.item.actions.find(v => v.id === a.id);
        if (action) {
          ActionHandler.reset(action, a.filters);
        }
      });
      this.updateActions();
    });
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
  }
}
