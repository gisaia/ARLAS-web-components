import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  linkedSignal,
  viewChild
} from '@angular/core';
import {ItemDataType} from '../utils/results.utils';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';

export interface MetaBadge {
  value: ItemDataType;
  icon?: string;
  unit?: string;
  overlay?: string;
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
export class ResultMetaBadgeComponent implements AfterViewInit {
  protected readonly NO_VALUE = '-';
  public metaBadge = input.required<MetaBadge>();
  public valueElement = viewChild<ElementRef>('element');
  public tooltip = linkedSignal<string>(() => this.metaBadge().overlay);
  private readonly TOOLTIP_VALUE_SPACER = '•';

 public constructor() {
  }

  public ngAfterViewInit() {
    this.hasOverflow();
  }

  public hasOverflow() {
    console.log(this.valueElement().nativeElement.scrollWidth > this.valueElement().nativeElement.clientWidth);
    if(this.valueElement().nativeElement.scrollWidth > this.valueElement().nativeElement.clientWidth){
      this.tooltip.set( `${this.metaBadge().overlay} ${this.TOOLTIP_VALUE_SPACER} ${this.metaBadge().value} ${this.metaBadge().unit}`);
    }
  }

}
