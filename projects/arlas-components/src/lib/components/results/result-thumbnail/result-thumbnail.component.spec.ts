import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultThumbnailComponent } from './result-thumbnail.component';

describe('ResultThumbnailComponent', () => {
  let component: ResultThumbnailComponent;
  let fixture: ComponentFixture<ResultThumbnailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultThumbnailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultThumbnailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
