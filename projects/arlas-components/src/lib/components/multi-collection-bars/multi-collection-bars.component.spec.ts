import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiCollectionBarsComponent } from './multi-collection-bars.component';

describe('MultiCollectionBarsComponent', () => {
  let component: MultiCollectionBarsComponent;
  let fixture: ComponentFixture<MultiCollectionBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiCollectionBarsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiCollectionBarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
