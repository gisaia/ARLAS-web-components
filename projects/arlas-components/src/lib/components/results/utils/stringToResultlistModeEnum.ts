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
import { ResultlistModeEnum } from './enumerations/resultlistModeEnum';


/**
 * For retro compatibility; In previous conf the value passed to defaultMode was grid or list.
 * But the value stand for an enum.
 **/
export function stringToResultlistModeEnum(value: string): ResultlistModeEnum {
  const isNumeric = !Number.isNaN(Number(value)) && value.trim() !== '';

  if (isNumeric) {
    switch (Number(value)) {
      case 0:
        return ResultlistModeEnum.list;
      case 1:
        return ResultlistModeEnum.grid;
      case 2:
        return ResultlistModeEnum.card;
      default:
        return ResultlistModeEnum.list;
    }
  } else {
    // Part for retro compatibility
    switch (value) {
      case 'grid' :
        return ResultlistModeEnum.grid;
      case 'list' :
        return ResultlistModeEnum.list;
      case 'card' :
        return ResultlistModeEnum.card;
      default:
        return ResultlistModeEnum.list;
    }
  }
}
