import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResultTasksComponent } from './result-tasks.component';

describe('ResultTasksComponent', () => {
  let component: ResultTasksComponent;
  let fixture: ComponentFixture<ResultTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultTasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultTasksComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
