# API

* [Histogram](#Histogram)
* [ResultList](#ResultList)

## Histogram

A generic component that plots data in a chart. 

### Inputs : 

- `data: Subject<Array<{key: number, value: number}>>` - Data to plot in the histogram. Please, check [data structure](#Data structure)
- `dataType: string` - To be set to **time** when x axis represents time and **numeric** otherwise. Default value is : **numeric**.
- `dataUnit: string` - (Optional) Unit to add in the tooltip
- `chartType: string` - Possible values are **area** and **bars**. Default value is : **area**.
- `chartTitle: string` - The chart title.
- `chartWidth: number` - The chart width.
- `chartHeight: number` - The histogram height.
- `isSmoothedCurve: boolean` - Whether the curve is smoothed or not. Default value is : **true**.
- `dateUnit` - The unit of data key when it represents time. Possible values are **second** and **millisecond**.
- `barWeight` - The weight of bars width. Values are between 0 and 1.
- `customizedCssClass: string` - Css class name.
- `intervalSelection: SelectedInputValues` - The selected interval of values.
- `ticksDateFormat: string` - The date format of ticks. Example : `%B %Y`. Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
- `valuesDateFormat: string` - The date format of the two labels below the chart. Example : `%A %d %B %Y`. Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
- `xTicks: number` - Number of ticks in the X axis.
- `yTicks: number` - Number of ticks in the Y axis.
- `xLabels: number` - Number of labels in the X axis.
- `yLabels: number` - Number of labels in the Y axis.
- `showXTicks: boolean` - Whether showing the x axis ticks or not. Default value is : **true**.
- `showYTicks: boolean` - Whether showing the y axis ticks or not. Default value is : **true**.
- `showXLabels: boolean` - Whether showing the x axis labels or not. Default value is : **true**.
- `showYLabels: boolean` - Whether showing the y axis labels or not. Default value is : **true**.

### Outputs : 

- `valuesChangedEvent: EventEmitter<{startvalue: any, endvalue: any}>` - Brush values end event.

### Data structure :

- The input data should be an array of `{ key: number, value: number }` object. 
- `key` represents the **X** axis values.
- `value` represents the **Y** axis values.
- When **X** axis values are **date** values, `key` should be given as timestamp and `[dataType] = "'time'"`

### Styling :

Customize styles :

- Axes, ticks and labels :
  - To style the axes use `histogram__axis` css class.
  - To style the axes use `histogram__axis` css class.
  - To style the ticks use `histogram__ticks` css class.
  - To style the labels use `histogram__labels` css class.
  
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

