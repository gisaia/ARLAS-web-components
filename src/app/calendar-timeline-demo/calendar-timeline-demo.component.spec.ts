import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarTimelineDemoComponent } from './calendar-timeline-demo.component';

describe('CalendarTimelineDemoComponent', () => {
  let component: CalendarTimelineDemoComponent;
  let fixture: ComponentFixture<CalendarTimelineDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CalendarTimelineDemoComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarTimelineDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
