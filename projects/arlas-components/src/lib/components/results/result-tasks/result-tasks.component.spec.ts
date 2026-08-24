import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Task, TaskSettingsService, TaskStatus } from '../utils/aias-process';
import { ResultTasksComponent } from './result-tasks.component';

describe('ResultTasksComponent', () => {
  let component: ResultTasksComponent;
  let fixture: ComponentFixture<ResultTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResultTasksComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        })
      ],
      providers: [
        {
          provide: TaskSettingsService,
          useValue: {
            getServiceTaskSettings: vi.fn()
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultTasksComponent);
    component = fixture.componentInstance;

    const tasks: Task[] = [
      {
        processID: 'dc3build',
        type: '',
        jobID: '',
        status: TaskStatus.accepted,
        message: '',
        created: 10,
        started: 10,
        resourceID: ''
      }
    ];
    fixture.componentRef.setInput('tasks', tasks);
    fixture.componentRef.setInput('service', 'AIAS APROC Service');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
