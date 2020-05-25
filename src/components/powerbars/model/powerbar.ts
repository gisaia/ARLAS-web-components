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

import { SimpleNode } from 'arlas-d3';

export class PowerBar {
  /**
   * @description Powerbar term.
   */
  public term: string;
  /**
   * @description Powerbar parent node term.
   */
  public parentTerm: string;
  /**
   * @description Term's occurence.
   */
  public count: number;
  /**
   * @description Powerbar progression.
   */
  public progression: number;
  /**
   * @description Whether the powerbar is selected.
   */
  public isSelected = false;

  /**
   * @description Path from the powerbar to the parent nodes
   */
  public path: Array<SimpleNode>;
  /**
   * @description class name to apply to the powerbar : `neutral-state`, `selected-bar` or `unselected-bar`.
   */
  public classSuffix = 'neutral-state';
  /**
   * @description color of the powerbar obtained from the powerbar term.
   */
  public color: string;

  constructor(term: string, parentTerm: string, count: number) {
    this.term = term;
    this.parentTerm = parentTerm;
    this.count = count;
  }
}
