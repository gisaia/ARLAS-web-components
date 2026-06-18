import {Component, computed, input, signal} from '@angular/core';
import {HybridField} from '../model/hybridField';
import {Item} from '../../../../../lib/components/results/model/item';
import {MetaBadge, ResultMetaBadgeComponent} from '../result-meta-badge/result-meta-badge.component';

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
  protected MAX_ITEM_PER_LINE = 3;
  private MAX_ROW = 3;
  private CONTAINER_WIDTH = 374;
  public maxitemwidth = '140px';

  public metaBadgesRows = computed<MetaBadge[][]>(() => {
    const badges = this.fields().map(field => ({
      value: this.item().itemData.get(field.fieldName),
      icon: field.icon,
      unit: field.dataType,
      overlay: field.fieldName
    }));
    this.MAX_ITEM_PER_LINE = Math.round(badges.length / this.MAX_ROW);
    this.maxitemwidth = `${Math.round( this.CONTAINER_WIDTH / this.MAX_ITEM_PER_LINE) - 16}px`;
    console.log('max item per row', this.MAX_ITEM_PER_LINE, 'max value width', this.maxitemwidth)
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
