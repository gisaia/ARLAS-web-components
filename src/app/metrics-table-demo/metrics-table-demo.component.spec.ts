import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MetricsTableDemoComponent } from './metrics-table-demo.component';

describe('MultiBarDemoComponent', () => {
  let component: MetricsTableDemoComponent;
  let fixture: ComponentFixture<MetricsTableDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MetricsTableDemoComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(MetricsTableDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
