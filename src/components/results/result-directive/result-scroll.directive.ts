import { Directive, Input, Output, HostListener, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { RowItem } from '../utils/rowItem';


@Directive({
    selector: '[arlasResultScroll]',
})

export class ResultScrollDirective {
  @Input() public rowItemList: Array<Map<string, string | number | Date>>;
  @Input() public nLastLines: number;
  @Input() public nbAllHits: number;
  @Output() public moreDataEvent: Subject<any> =  new Subject<any>();
  private lastScrollTop = 0;
  private lastDataSize = 0;
  private tbodyHeight;

  constructor (private el: ElementRef) {}

  @HostListener('scroll', ['$event'])
  public onScroll(event) {
    this.tbodyHeight = this.el.nativeElement.offsetHeight;
    const scrollTop = this.el.nativeElement.scrollTop;
    const scrollHeight = this.el.nativeElement.scrollHeight;
    const scrollDown = scrollHeight - scrollTop;
    const nLastElementsHeight = this.tbodyHeight / scrollHeight * this.rowItemList.length * (this.nLastLines + 1);
    // Ask for more data when the scroll bar :
    // - reaches for the "nLastLines" last lines and it is scrolling down only
    // - when data size increased (this last condition is added because of the first one (scrollDown  < nLastElementsHeight) )
    if ( scrollDown  < nLastElementsHeight + this.tbodyHeight && this.isScrollingDown(scrollTop) && this.hasDataSizeChanged() ) {
      this.lastDataSize = this.rowItemList.length;
      if (this.rowItemList.length < this.nbAllHits) {
        this.moreDataEvent.next('more_data');
      }
    }
    this.lastScrollTop = scrollTop;
  }

  private isScrollingDown(scrollTop) {
    if ( scrollTop > this.lastScrollTop) {
      return true;
    }
  }

  private hasDataSizeChanged() {
    if (this.rowItemList.length > this.lastDataSize) {
      return true;
    }
  }
}
