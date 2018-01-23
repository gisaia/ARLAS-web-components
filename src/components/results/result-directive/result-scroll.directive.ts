import { Directive, Input, Output, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ModeEnum } from '../utils/enumerations/modeEnum';


@Directive({
  selector: '[arlasResultScroll]',
})

export class ResultScrollDirective implements OnChanges {
  @Input() public rowItemList: Array<Map<string, string | number | Date>>;
  @Input() public nLastLines: number;
  @Input() public nbGridColumns: number;
  @Input() public searchSize: number;
  @Input() public resultMode: ModeEnum;
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();
  private lastScrollTop = 0;
  private lastDataSize = 0;
  private moreDataCallsCounter;
  private tbodyHeight;
  private isChangedScroll = false;
  private nbScrolledLines;
  private top;
  private height;
  constructor(private el: ElementRef) { }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['rowItemList']) {
      this.moreDataCallsCounter = 0;
      this.lastScrollTop = 0;
      this.lastDataSize = 0;
      this.el.nativeElement.scrollTop = 0;
    }
    if (changes['resultMode']) {
      this.scrollTo();

    }
  }

  public scrollTo() {
    if (this.rowItemList) {
      if (this.resultMode === ModeEnum.grid) {
        this.nbScrolledLines = Math.round(this.top / this.height * this.rowItemList.length);
        if (this.nbScrolledLines % this.nbGridColumns !== 0) {
          this.nbScrolledLines = Math.max(this.nbScrolledLines - this.nbScrolledLines % this.nbGridColumns, 0);
        }
      } else {
        this.nbScrolledLines = Math.round(this.top / this.height * this.rowItemList.length);
      }
      this.el.nativeElement.scrollTop = 0;
      this.isChangedScroll = true;
    }
  }

  // When scrolling, the position of the scroll bar is calculated
  // Ask for more data when the scroll bar :
  // - reaches for the "nLastLines" last lines and it is scrolling down only
  // - when data size increased of 'searchSize' step
  @HostListener('scroll', ['$event'])
  public onScroll(event) {
    this.tbodyHeight = this.el.nativeElement.offsetHeight;
    const scrollTop = this.el.nativeElement.scrollTop;
    const scrollHeight = this.el.nativeElement.scrollHeight;
    const scrollDown = scrollHeight - scrollTop;
    const nLastLines = this.nLastLines / ((this.nbGridColumns - 1) * this.resultMode + 1);
    const dataLength = this.rowItemList.length / ((this.nbGridColumns - 1) * this.resultMode + 1);
    const scrollTopTrigger = scrollHeight * (1 - nLastLines / dataLength - this.tbodyHeight / scrollHeight);

    if (this.isChangedScroll) {
      this.el.nativeElement.scrollTop = scrollHeight * this.nbScrolledLines / this.rowItemList.length;
      this.isChangedScroll = false;
    }
    this.top = scrollTop;
    this.height = scrollHeight;
    if (scrollTop >= scrollTopTrigger && this.isScrollingDown(scrollTop)) {
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
