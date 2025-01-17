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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PowerBar } from '../model/powerbar';
import { DEFAULT_SHORTENING_PRECISION, NUMBER_FORMAT_CHAR } from '../../componentsUtils';
import { PowerBar } from '../model/powerbar';

@Component({
    selector: 'arlas-powerbar',
    templateUrl: './powerbar.component.html',
    styleUrls: ['./powerbar.component.scss']
})
export class PowerbarComponent {

    @Input() public powerbar: PowerBar;
    /**
     * @Input : Angular
     * @description Precision when rounding numbers (ie the count next to the progress bar).
     * Default is 2.
     */
    @Input() public numberShorteningPrecision = DEFAULT_SHORTENING_PRECISION;
    /**
     * @Input : Angular
     * @description Unit the a powerbar represents
     */
    @Input() public unit = '';
    /**
     * @Input : Angular
     * @description Whether to allow colorizing the bar according to its term or not using keysToColors
     */
    @Input() public useColorService = false;
    /**
     * @Input : Angular
     * @description Whether to allow colorizing the bar according to its term or not using a field of the data
     */
    @Input() public useColorFromData = false;

    /**
     * @Input : Angular
     * @description Hide selected powerbar
     */
    @Input() public hideSelected = true;

    /**
     * @Input : Angular
     * @description Whether to have the option to select the powerbar using checkboxes.
     */
    @Input() public selectWithCheckbox = false;

    @Output() public onCheckEvent: EventEmitter<boolean> = new EventEmitter();

    @Output() public onClickEvent = new EventEmitter<boolean>();

    public NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;

    public onCheck() {
        this.onCheckEvent.emit(true);
    }

    public onSelect() {
        this.onClickEvent.emit(true);
    }
}
