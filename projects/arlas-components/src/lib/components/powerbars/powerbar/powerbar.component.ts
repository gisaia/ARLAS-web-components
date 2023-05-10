import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PowerBar } from '../model/powerbar';
import { DEFAULT_SHORTENING_PRECISION, NUMBER_FORMAT_CHAR } from '../../componentsUtils';

@Component({
    selector: 'arlas-powerbar',
    templateUrl: './powerbar.component.html',
    styleUrls: ['./powerbar.component.css']
})
export class PowerbarComponent implements OnInit {

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


    public NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;


    public ngOnInit(): void {
    }

    public onCheck() {
        this.onCheckEvent.emit(true);
    }

}
