import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CogVisualisationComponent } from './cog-visualisation.component';

describe('CogVisualisationComponent', () => {
  let component: CogVisualisationComponent;
  let fixture: ComponentFixture<CogVisualisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CogVisualisationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CogVisualisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
