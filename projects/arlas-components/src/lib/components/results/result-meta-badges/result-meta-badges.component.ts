import {Component, computed, ElementRef, inject, input, signal, viewChild} from '@angular/core';
import {HybridField} from '../model/hybridField';
import {Item} from '../../../../../lib/components/results/model/item';
import {MetaBadge, ResultMetaBadgeComponent} from '../result-meta-badge/result-meta-badge.component';
import {RowRenderCalcuolatorService} from '../../../services/row-render-calcuolator.service';

@Component({
  selector: 'arlas-result-meta-badges',
  imports: [
    ResultMetaBadgeComponent
  ],
  templateUrl: './result-meta-badges.component.html',
  styleUrl: './result-meta-badges.component.scss'
})
export class ResultMetaBadgesComponent {
  public item = input<Item>(undefined);
  public fields = input<HybridField[]>([]);
  public containerWidth = input<number>(360);
  public spacingChar = input<string>('•');
  public contentContainer = viewChild<ElementRef<HTMLElement>>('container');
  protected MAX_ITEM_PER_LINE = 3;
  private MAX_ROW = 3;
  private containerwidth = 364;
  public maxitemwidth = '140px';
  public DEFAULT_MIN_WIDTH = 100;
  public TOOLTIP_VALUE_SPACER = ':';
  private readonly rowRenderCalcuolatorService = inject(RowRenderCalcuolatorService)
  public metaBadgesRows = computed<MetaBadge[][]>(() => {
    const badges = this.fields().map(field => ({
      value: this.item().itemData.get(field.fieldName),
      icon: field.icon,
      unit: field.dataType,
      tooltip: `${field.fieldName} ${this.TOOLTIP_VALUE_SPACER} ${this.item().itemData.get(field.fieldName)} ${field.dataType}`
    }));

    console.log('badge lenght', badges.length, badges)
    const spacerTotalWidth = 17;
    this.containerwidth = this.contentContainer().nativeElement.getBoundingClientRect().width ?? this.containerwidth
    const {maxRow, maxItemWidth, maxItemPerLine} = this.rowRenderCalcuolatorService
      .calculatedResults(this.containerwidth, this.MAX_ROW,badges.length,this.DEFAULT_MIN_WIDTH,  spacerTotalWidth)
    this.MAX_ROW = maxRow;
    console.log('MAX_ROW', this.MAX_ROW, badges.length / (this.containerwidth / this.DEFAULT_MIN_WIDTH))
    console.log('badge lenght', badges.length, badges.length / this.MAX_ROW)
    this.MAX_ITEM_PER_LINE = maxItemPerLine;
    console.log('bMAX_ITEM_PER_LINE',  this.MAX_ITEM_PER_LINE)
    this.maxitemwidth = maxItemWidth;
    console.log('max value width', this.maxitemwidth)
    return this.rows(badges);
  });

  public rows(metaBages: MetaBadge[]): any[][] {
    const result = [];
    let slice = this.MAX_ITEM_PER_LINE;;
    for (let i = 0; i < this.MAX_ROW; i++) {
      result.push(metaBages.slice(slice - this.MAX_ITEM_PER_LINE, slice));
      slice+=this.MAX_ITEM_PER_LINE;
    }
    console.log(result)
    return result;
  }
}
