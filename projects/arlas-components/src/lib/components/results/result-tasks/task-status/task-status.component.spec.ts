import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { TaskStatus } from '../../utils/aias-process';
import { TaskStatusComponent } from './task-status.component';

describe('TaskStatusComponent', () => {
  let component: TaskStatusComponent;
  let fixture: ComponentFixture<TaskStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskStatusComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskStatusComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('task', {
      processID: 'dc3build',
      type: '',
      jobID: '',
      status: TaskStatus.accepted,
      message: '',
      created: 10,
      started: 10,
      resourceID: ''
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
