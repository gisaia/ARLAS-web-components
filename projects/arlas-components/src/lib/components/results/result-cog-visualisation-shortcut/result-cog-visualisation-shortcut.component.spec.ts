import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultCogVisualisationShortcutComponent } from './result-cog-visualisation-shortcut.component';

describe('CogVisualisationShortcutComponent', () => {
  let component: ResultCogVisualisationShortcutComponent;
  let fixture: ComponentFixture<ResultCogVisualisationShortcutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultCogVisualisationShortcutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultCogVisualisationShortcutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
