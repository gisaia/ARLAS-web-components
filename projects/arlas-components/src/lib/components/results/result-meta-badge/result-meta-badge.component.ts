import {ChangeDetectionStrategy, Component, input, linkedSignal} from '@angular/core';
import {ItemDataType} from '../utils/results.utils';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';

export interface MetaBadge {
  value: ItemDataType;
  icon?: string;
  unit?: string;
  tooltip?: string;
}

@Component({
  selector: 'arlas-result-meta-badge',
  imports: [
    MatIcon,
    MatTooltip
  ],
  templateUrl: './result-meta-badge.component.html',
  styleUrl: './result-meta-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultMetaBadgeComponent {
  protected readonly NO_VALUE = '-';
  public metaBadge = input.required<MetaBadge>();
  public maxWidth = input<string>('120px');
  public tooltip = linkedSignal<string>(() => this.metaBadge().tooltip);
}
