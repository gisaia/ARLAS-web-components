import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { LegendItemComponent } from './legend-item.component';

describe('LegendItemComponent', () => {
  let component: LegendItemComponent;
  let fixture: ComponentFixture<LegendItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LegendItemComponent ],
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LegendItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
