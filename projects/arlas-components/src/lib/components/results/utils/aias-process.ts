/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Injectable } from '@angular/core';

export enum TaskStatus {
  accepted = 'accepted',
  running = 'running',
  successful = 'successful',
  failed = 'failed',
  dismissed = 'dismissed'
}

export type AvailableProcess = 'download' | 'ingest' | 'directory_ingest' | 'enrich' | 'dc3build';

export interface Task {
  processID: AvailableProcess;
  type: string;
  jobID: string;
  status: TaskStatus;
  message: string;
  created: number;
  started: number;
  finished?: number;
  updated?: number;
  progress?: number;
  links?: any;
  resourceID: string;
}

/** Default time in ms between each call to retrieve a service's tasks */
export const DEFAULT_TASK_RETRIEVAL_INTERVAL = 5000;

export interface TaskSettings {
  /** Whether the retrieval of AIAS task status is enabled */
  enabled: boolean;
  /** Name of the service */
  service: string;
  /** URL of the APROC service */
  url: string;
  /** Collections for which the task retrieval is allowed */
  collections: string[];
  /** Processes to hide from the user */
  ignoredProcess?: string[];
  /** If one task is not in a final state, interval in ms before refreshing the tasks */
  taskRetrievalTimer?: number;
}

@Injectable({
  providedIn: 'root'
})
export abstract class TaskSettingsService {
  public abstract getServiceTaskSettings(service: string): TaskSettings | undefined;
}
