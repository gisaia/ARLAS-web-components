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

import { Field } from './field';

/**
 * Configuration for a single field displayed in a card view badge.
 * Each instance describes one card property: how to look up the value, display it,
 * and which row it belongs to.
 */
export interface CardViewProperty extends Field {
  /** Display label shown in the badge tooltip */
  prettyName: string;
  /** Whether this field is the card title (displayed prominently) */
  isTitle: boolean;
  /** Row index for grouping badges into lines (same value = same row) */
  lineNumber: number;
  /** Material icon name displayed alongside the value */
  icon?: string;

}

