import { Directive, Input, Output, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ModeEnum } from '../utils/enumerations/modeEnum';


@Directive({
  selector: '[arlasResultScroll]',
})

export class ResultScrollDirective implements OnChanges {
  @Input() public rowItemList: Array<Map<string, string | number | Date>>;
  @Input() public nLastLines: number;
  @Input() public searchSize: number;
  @Input() public resultMode: ModeEnum;
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();
  private lastScrollTop = 0;
  private lastDataSize = 0;
  private moreDataCallsCounter;
  private tbodyHeight;
  constructor(private el: ElementRef) { }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['rowItemList'] || changes['resultMode'] ) {
      this.moreDataCallsCounter = 0;
      this.lastScrollTop = 0;
      this.lastDataSize = 0;
      this.el.nativeElement.scrollTop = 0;
    }
  }

  // When scrolling, the position of the scroll bar is calculated
  // Ask for more data when the scroll bar :
    // - reaches for the "nLastLines" last lines and it is scrolling down only
    // - when data size increased of 'searchSize'
  @HostListener('scroll', ['$event'])
  public onScroll(event) {
    this.tbodyHeight = this.el.nativeElement.offsetHeight;
    const scrollTop = this.el.nativeElement.scrollTop;
    const scrollHeight = this.el.nativeElement.scrollHeight;
    const scrollDown = scrollHeight - scrollTop;
    const nLastElementsHeight = this.tbodyHeight / scrollHeight * this.rowItemList.length * (this.nLastLines + 1);
    if (scrollDown < nLastElementsHeight + this.tbodyHeight && this.isScrollingDown(scrollTop)) {
      if ((this.rowItemList.length - this.lastDataSize) === this.searchSize) {
        this.moreDataCallsCounter++;
        this.moreDataEvent.next(this.moreDataCallsCounter);
        this.lastDataSize = this.rowItemList.length;
      }
    }
    this.lastScrollTop = scrollTop;
  }

  private isScrollingDown(scrollTop) {
    if (scrollTop > this.lastScrollTop) {
      return true;
    }
  }

}
