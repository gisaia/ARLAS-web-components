import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PowerbarModule } from '../powerbars/powerbar/powerbar.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { PowerBar } from '../powerbars/model/powerbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MultiBarsRowComponent } from './multi-bars-row/multi-bars-row.component';

interface MultiBarTable {
  header: MultiBarHeader[];
  data: MultiBarRow[];
}

interface MultiBarHeader {
  title: string;
  subTitle: string;
  metric: string;
}

interface MultiBarData {
  value: number;
  maxValue: number;
}

export interface MultiBarRow {
  header: string;
  data: MultiBarData[];
}

@Component({
  selector: 'arlas-multi-collection-bars',
  templateUrl: './multi-collection-bars.component.html',
  styleUrls: ['./multi-collection-bars.component.scss'],
  imports: [
    PowerbarModule,
    MatTooltipModule,
    NgForOf,
    NgClass,
    NgIf,
    UpperCasePipe,
    MatCheckboxModule,
    TranslateModule,
    MultiBarsRowComponent
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiCollectionBarsComponent implements OnInit {
  @Input() public multiBarTable: MultiBarTable = {
    header: [
      {title: 'produit', subTitle: ' couverture nuageuse', metric: 'avg'},
      {title: 'flikr', subTitle: ' couverture', metric: 'min'},
      {title: 'rere', subTitle: ' couverture', metric: 'min'},
      {title: 'trode', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        header: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 0},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        header: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
          ]
      },
      {
        header: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 0}, {value: 500, maxValue: 1000}]
      },
      {
        header: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        header: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public colors: string[] = ['#ff6347', '#3cb371', '#ee82ee', '#6a5acd', '#ffa500'];

  /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its term or not using keysToColors
   */
  @Input() public useColorService = false;

  @Input() public selectWithCheckbox = true;

  @Output() public onSelect = new EventEmitter();


  // keep it time complexity o(1) with get.
  protected powerBarList: Map<number, PowerBar[]> = new Map();
  protected selectedKey: Set<string> = new Set();
  protected pendingMode = false;

  public constructor() {
  }

  public ngOnInit(): void {
    this.buildPowerBars();
  }

  public buildPowerBars() {
    this.multiBarTable.data.forEach((d, rowIndex) => {
      this.powerBarList.set(rowIndex, []);
      d.data.forEach((item, i) => {
        const p = new PowerBar('', '', item.value);
        p.progression = (item.value / item.maxValue) * 100;
        p.color = this.colors[i];
        this.powerBarList.get(rowIndex).push(p);
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
}
