import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultGridTileComponent } from './result-grid-tile.component';

describe('ResultGridTileComponent', () => {
  let component: ResultGridTileComponent;
  let fixture: ComponentFixture<ResultGridTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultGridTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultGridTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
