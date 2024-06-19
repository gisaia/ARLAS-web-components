import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiCollectionBarsComponent } from './multi-collection-bars.component';
import { MultiBarsRowComponent } from "./multi-bars-row/multi-bars-row.component";
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from "@ngx-translate/core";

describe('MultiCollectionBarsComponent', () => {
  let component: MultiCollectionBarsComponent;
  let fixture: ComponentFixture<MultiCollectionBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
     imports: [MultiBarsRowComponent,
       MultiCollectionBarsComponent,
       TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),]
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
