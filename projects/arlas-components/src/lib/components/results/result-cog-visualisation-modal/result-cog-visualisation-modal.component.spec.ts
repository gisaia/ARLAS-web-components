import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultCogVisualisationModalComponent } from './result-cog-visualisation-modal.component';

describe('ResultCogVisualisationModalComponent', () => {
  let component: ResultCogVisualisationModalComponent;
  let fixture: ComponentFixture<ResultCogVisualisationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultCogVisualisationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultCogVisualisationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
