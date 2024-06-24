import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PowerbarModule } from '../powerbars/powerbar/powerbar.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { PowerBar } from '../powerbars/model/powerbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MetricsTableRowComponent } from './multi-bars-row/metrics-table-row.component';
import * as tinycolor from 'tinycolor2';
import { ArlasColorService } from '../../services/color.generator.service';
import { FormatLongTitlePipe } from '../../pipes/format-title/format-long-title.pipe';

export interface MetricsTable {
  header: MetricsTableHeader[];
  data: MetricsTableRow[];
}

export interface MetricsTableHeader {
  title: string;
  subTitle: string;
  metric: string;
}

export interface MetricsTableData {
  value: number;
  maxValue: number;
}

export interface MetricsTableRow {
  term: string;
  data: MetricsTableData[];
}

@Component({
  selector: 'arlas-metrics-table',
  templateUrl: './metrics-table.component.html',
  styleUrls: ['./metrics-table.component.scss'],
  imports: [
    PowerbarModule,
    MatTooltipModule,
    NgForOf,
    NgClass,
    NgIf,
    UpperCasePipe,
    MatCheckboxModule,
    TranslateModule,
    MetricsTableRowComponent,
    FormatLongTitlePipe
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsTableComponent implements OnInit {
  /**
   * @Input : Angular
   * @description Data to build the table.
   */
  @Input() public multiBarTable: MetricsTable;

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<[string, string]>;


  /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its term or not using keysToColors
   */
  @Input() public useColorService = false;

  /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its column term or row term
   */
  @Input() public applyColorTo: 'column' | 'row' = 'column';

  /**
   * @Input : Angular
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore saturation of generated colors will be within this tightened scale.
   */
  @Input() public colorsSaturationWeight;

  /**
   * @description Allow to select a row by a checkbox
   */
  @Input() public selectWithCheckbox = true;

  /**
   * @description Allow to select display mode for this component
   */
  @Input() public headerDisplayMode: 'indicator' | 'titleOnly' | 'full' = 'indicator';


  @Output() public onSelect = new EventEmitter();


  // keep it time complexity o(1) with get.
  protected powerBarsList: Map<number, PowerBar[]> = new Map();
  protected selectedKey: Set<string> = new Set();
  protected pendingMode = false;
  protected shortcutColor = [];
  protected titleAreDifferent = true;

  public constructor(private colorService: ArlasColorService) {
    this.colorService.changekeysToColors$.subscribe(() => {
      this.powerBarsList.forEach(powerbarsRow => {
        powerbarsRow.forEach(p => {
          if (this.useColorService) {
            this.definePowerBarColor(p);
          }
        });
      });
    });
  }

  public ngOnInit(): void {
    if(this.multiBarTable) {
      this.buildPowerBars();
      this.buildIndicators();
      this.verifyIfSameTitle();
    }
  }

  public verifyIfSameTitle(){
    this.titleAreDifferent = this.multiBarTable.header.every((current, i) =>{
      if(i === this.multiBarTable.header.length - 1){
        return true;
      }
      const nextTitle =   this.multiBarTable.header[i + 1].title;
      return current.title !== nextTitle;
    });

    if(!this.titleAreDifferent) {
      this.headerDisplayMode = 'titleOnly';
    }

  }

  public buildIndicators(){
    this.powerBarsList.forEach(powerBarList => {
      if(!this.useColorService && !this.keysToColors || this.applyColorTo === 'row') {
        this.shortcutColor.push('#88c9c3');
      } else {
        powerBarList.forEach(powerBars => {
          this.shortcutColor.push(powerBars.color);
        });
      }
    });
  }

  public buildPowerBars() {
    this.multiBarTable.data.forEach((merticsRow, rowIndex) => {
      this.powerBarsList.set(rowIndex, []);
      merticsRow.data.forEach((item, i) => {
        let powerBar;
        if(this.applyColorTo === 'row') {
          powerBar = new PowerBar(merticsRow.term, merticsRow.term, item.value);
        } else if(this.applyColorTo === 'column') {
          const header = this.multiBarTable.header[i];
          powerBar = new PowerBar(header.title, header.title, item.value);
        }

        powerBar.progression = (item.value / item.maxValue) * 100;
        if(this.keysToColors && !this.useColorService) {
         const keyColorPair = this.keysToColors.find(keyColorPair =>
           keyColorPair[0].toLowerCase() === powerBar.term.toLowerCase());
         if(keyColorPair){
           powerBar.color = '#'+keyColorPair[1];
         } else {
           powerBar.color = '#88c9c3';
         }
        }
        if(this.useColorService) {
          this.definePowerBarColor(powerBar);
        }
        this.powerBarsList.get(rowIndex).push(powerBar);
      });
    });
  }


  public addRowItem(key: string) {
    this.sendKeys(key);
    this.togglePendingMode();
  }

  public sendKeys(key: string) {
    if (this.selectedKey.has(key)) {
      this.selectedKey.delete(key);
    } else {
      this.selectedKey.add(key);
    }
    this.onSelect.next(this.selectedKey);
  }

  public togglePendingMode(){
    this.pendingMode = this.selectedKey.size !== 0;
  }

  private definePowerBarColor(powerBar: PowerBar){
      const rgbaColor = tinycolor.default(this.colorService.getColor(powerBar.term, this.keysToColors,
        this.colorsSaturationWeight)).toRgb();
      powerBar.color = this.getPowerbarColor(rgbaColor);
  }

  private getPowerbarColor(rgbaColor: tinycolor.ColorFormats.RGBA): string{
    return 'rgba(' + [rgbaColor.r, rgbaColor.g, rgbaColor.b, 0.7].join(',') + ')';
  }
}