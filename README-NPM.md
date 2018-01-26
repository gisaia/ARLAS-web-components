## Histogram :

A generic component that plots data in a chart. 

### Inputs : 

#### Inputs related to the chart's data :
| Input           |  Type                                             | Description                 | Optional/ Mandatory |
| --------------  |  ------------------------------------------------ | --------------------------- | ------------------- |
| **data**        |  Please, check [data structure](#Data structure)  | Data to plot in the chart   | **Mandatory**       |
| **dataType**    |  `DataType : time, numeric` (Enum) | To be set to **time** when x axis represents dates and to **numeric** otherwise | **Default :** `numeric` |
| **dateUnit**    |  `DateUnit : second, millisecond` (Enum)          | The unity of data key when it represents **time** | **Default :** `numeric`      |
| **dataUnit**    |  `string`                                         | Unity of data to add in the end of tooltip values  | **Optional**                 |
| **valuesDateFormat** | `string` | The date format of the start/end values. Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).                        | **Default :** `d3` default value (depends on the x axis scale)|

#### Inputs related to data selection :
| Input                     |  Type                                             | Description                                | Optional/ Mandatory   |
| ------------------------- |  ------------------------------------------------ | ------------------------------------------ | --------------------- |
| **isHistogramSelectable** |  `boolean`                                        | Whether the chart is selectable or not     | **Default :** `true`  |
| **multiselectable**       |  `boolean`                                        | Whether the selection is multiple or not   | **Default :** `false` |
| **intervalSelection**     |  `SelectedInputValues`                            | A single interval that selects data        | **Optional**          |
| **intervalListSelection** |  `SelectedInputValues[]`                          | A list of intervals that select data       | **Optional**          |
| **topOffsetRemoveInterval**  |  `numeric`                                     | Top position of the remove-selection-button| **Default :** `40`    |
| **leftOffsetRemoveInterval** |  `numeric`                                     | Left position of the remove-selection-button | **Default :** `18`  |
| **brushHandlesHeightWeight** |  `numeric`                                     | A 0 to 1 weight of the brush height. It controls the brush handles height.        | **Default :** `0.5`   |
 
#### Inputs related to the chart's type and dimensions :

| Input           |  Type                                                  | Description                 | Optional/ Mandatory |
| --------------  |  ----------------------------------------------------- | --------------------------- | ------------------- |
| **chartType**   | `ChartType : area, bars, oneDimension, swimlane` (Enum) | Chart's representation type | **Default :** `area`|
| **chartTitle**  | `string`                                               | Chart's title               | **Optional**        |
| **chartWidth**  | `numeric` | Chart's width. If not specified, the chart takes the component's container width   | **Optional**  |
| **chartHeight** | `numeric` | Chart's height. If not specified, the chart takes the component's container height | **Optional**  |
| **customizedCssClass** | `string` | Css class name to use to customize a specific `arlas-histogram` component  | **Optional**  |

#### Inputs related to the chart axes :descriptionPosition :

| Input               |  Type                           | Description                              | Optional/ Mandatory     |
| ------------------- |  ------------------------------ | ---------------------------------------- | ----------------------- |
| **xAxisPosition**   | `Position : top, bottom` (Enum)  | The xAxis positon : above or below the chart      | **Default :** `bottom`  |
| **descriptionPosition** | `Position : top, bottom` (Enum)  | The start/end values positon : above or below the chart | **Default :** `bottom`  |
| **xTicks**          | `numeric`                       | Number of ticks in the X axis            | **Default :** `5`       |
| **yTicks**          | `numeric`                       | Number of ticks in the Y axis            | **Default :** `5`       |
| **xLabels**         | `numeric`                       | Number of labels in the X axis           | **Default :** `5`       |
| **yLabels**         | `numeric`                       | Number of labels in the Y axis           | **Default :** `5`       |
| **showXTicks**      | `boolean`                       | Whether showing the x axis ticks or not  | **Default :** `true`    |
| **showYTicks**      | `boolean`                       | Whether showing the y axis ticks or not  | **Default :** `true`    |
| **showXLabels**     | `boolean`                       | Whether showing the x labels labels or not   | **Default :** `true`    |
| **showYLabels**     | `boolean`                       | Whether showing the y labels ticks or not   | **Default :** `true`    |
| **ticksDateFormat** | `string`                        | The date format of ticks. Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).                        | **Default :** `d3` default value (depends on the x axis scale) |

#### Inputs related to **area** ChartType :  
| Input               |  Type                           | Description                              | Optional/ Mandatory  |
| ------------------- |  ------------------------------ | ---------------------------------------- | -------------------- |
| **isSmoothedCurve** | `boolean`                       | Whether the curve is smoothed or not     | **Default** : `true` |

#### Inputs related to **bars** ChartType :  
| Input               |  Type                           | Description                              | Optional/ Mandatory  |
| ------------------- |  ------------------------------ | ---------------------------------------- | -------------------- |
| **barWeight**       | `numeric`                       | A 0 to 1 weight applied to bars width. 0 being excluded    | **Default** : `0.6`  |

#### Inputs related to **oneDimension** ChartType :  
| Input               |  Type                           | Description                              | Optional/ Mandatory  |
| ------------------- |  ------------------------------ | ---------------------------------------- | -------------------- |
| **paletteColors**   | `string` or `[number, number]`  | Either a hex string color or a color name (in English) or a saturation interval| **Optional**       |

#### Inputs related to **swimlane** ChartType :  
| Input               |  Type                           | Description                                 | Optional/ Mandatory  |
| ------------------- |  ------------------------------ | ------------------------------------------- | -------------------- |
| **paletteColors**   | `string` or `[number, number]`  | Either a hex string color or a color name (in English) or a saturation interval| **Optional**       |
| **barWeight**       | `numeric`                       | A 0 to 1 weight applied to bars width. 0 being excluded  | **Default** : `0.6`  |
| **swimlaneHeight**  | `numeric`                       | The height of a single lane. If not specified, a lane height is the chartHeight devided by the number of lanes  | **Optional**  |
| **swimlaneBorderRadius** | `numeric`                  | The radius of swimlane bars borders          | **Default** : `3`    |
| **swimlaneMode**    | `SwimlaneMode: fixedHeight, variableHeight, circle` | The swimlane representation mode | **Default** : `fixedHeight`  |
| **swimLaneLabelsWidth** | `numeric`                   | The width of swimlane labels space              | **Default** : `20% of the chart width`  |


### Outputs : 

> `valuesListChangedEvent: Subject<SelectedOutputValue>` : Emits the list of selected intervals.
 
### Data structure :

- The input data should be an array of `{ key: number, value: number }` object. 
- `key` represents the **X** axis values.
- `value` represents the **Y** axis values.
- When **X** axis values are **date** values, `key` should be given as timestamp and `[dataType] = "'time'"`
- When `[chartType] = "'oneDimension'"`, `value` must be between 0 and 1.

### Styling :

Customize styles :

```
- Axes, ticks and labels :
  - To style the axes use `histogram__axis` css class.
  - To style the ticks use `histogram__ticks` css class.
  - To style the labels use `histogram__labels` css class.
```

- Bars : 
  - To style the fully selected bars, use `histogram__chart--bar__fullyselected` css class.
  - To style the partly selected bars, use `histogram__chart--bar__partlyselected` css class.
  - To style the non-selected bars, use `histogram__chart--bar` css class.


## ResultList

A component to structure data in a filterable, sortable, selectable table. 

### Inputs : 

| Input           | type                                                               | Description                 | Optional/ Mandatory |
| --------------  |  ----------------------------------------------------------------- | --------------------------- | ------------------- |
| **fieldsList**  | `Array<{columnName: string, fieldName: string, dataType: string}>` | - **columnName** is the shown name. -**fieldName** is the real field name that's hidden. **dataType** (degree, percentage, etc). It includes an ID field. It will be the id of each item | Mandatory  |
| **idFieldName** | `string`                                                           | - Name of the id field | Mandatory  |
| **rowItemList** | `Array<Map<string, string | number | Date>>`                       | - It's a list of fieldName-fieldValue map | Mandatory  |
| **tableWidth**  | `number`                                                           | - The table width. If not specified, the tableWidth value is equal to container width | Optional |
| **detailedDataRetriever** | `DetailedDataRetriever`                                  | - A detailed-data retriever object that implements DetailedDataRetriever interface | Mandatory  |
| **searchSize**   | `number`                                                          | - Number of new rows added after each moreDataEvent | Mandatory  |
| **nLastLines**  | `number`                                                           | - When the scrollbar achieves this lines, more data is called | Optional. Default value is 5.  |
| **displayFilters** | `boolean` | - Whether the filters are displayed or not | **Default** : `true` |

### Outputs : 

| Output                  | type                                                        | Description           |
| ----------------------  |  ---------------------------------------------------------- | --------------------- |
| **sortColumnEvent**     | `Subject<{fieldName: string, sortDirection: SortEnum}>`     | - **SortEnum** is an enumeration. Its values are : asc, desc 
| **searchedFieldsEvent** | `Subject<Map<string, string | number | Date>>`              | - Emits a Map of filtered-fields and filter-value. The filters are triggered when pressing Enter key or when losing the focus  |
| **selectedItemsEvent**  | `Subject<Array<string>>`                                    | - Emits the list of identifiers of the selected items |
| **consultedItemEvent**  | `Subject<string>`                                           | - Emits the identifier of the hovered item. |
| **moreDataEvent**       | `Subject<number>`                                           | - The moreDataEvent notify the need for more data. The parameter of the Subject is the number of times this event has been called. |
| **actionOnItemEvent**   | `Subject<{action: Action, productIdentifier: ProductIdentifier}>`   | - Emits the clicked-on action id of the productIdentifier |

### Interfaces :

1. DetailedDataRetriever:

```
export interface DetailedDataRetriever {

  getData(identifier: string): Observable<{details: Map<string, string>, actions: Array<Action>}>;

}
```

2. Action: 

```
export interface Action {
  id: string;
  label: string;
  actionBus: Subject<{idFieldName: string, idValue: string}>;
}
```

3. ProductIdentifier:

```
export interface ProductIdentifier {
  idFieldName: string;
  idValue: string;
}
```

