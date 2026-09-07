import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockRowItem } from '../../../test/mock';
import { ResultQuicklookActionsComponent } from './result-quicklook-actions.component';

describe('ResultQuicklookActionsComponent', () => {
  let component: ResultQuicklookActionsComponent;
  let fixture: ComponentFixture<ResultQuicklookActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultQuicklookActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultQuicklookActionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('gridTile', mockRowItem);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
