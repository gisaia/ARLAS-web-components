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

import { Pipe, PipeTransform } from '@angular/core';
import { Action, ActionHandler } from '../utils/results.utils';

@Pipe({
  name: 'actionDisplayer'
})
export class ActionDisplayerPipe implements PipeTransform {

  /**
   * @param a Action
   * @param displayElement Part of the action displayed in the template
   * @returns According to the action's state, returns the right displayElement.
   */
  public transform(a: Action, displayElement: 'label' | 'tooltip' | 'id' | 'icon') {
    /** Note that if an action has been activated, we display the elements of the reverse action ! */
    /** For example if the action of 'visualize' on map is activated, we display the reverse action 'Remove from map'. */
    switch (displayElement) {
      case 'label':
        return ActionHandler.isReversible(a) ?
          (a.activated ? a.reverseAction?.label : a.label) :
          a.label;
      case 'tooltip':
        return ActionHandler.isReversible(a) ?
          (a.activated ? a.reverseAction?.tooltip : a.tooltip) :
          a.tooltip;
      case 'id':
        return ActionHandler.isReversible(a) ?
          (a.activated ? a.reverseAction?.id : a.id) :
          a.id;
      case 'icon':
        return ActionHandler.isReversible(a) ?
          (a.activated ? a.reverseAction?.icon : a.icon) :
          a.icon;
    }
  }
}
