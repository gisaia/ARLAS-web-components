# ARLAS UI Components

Generic components to use in your project to :

- Display a big amount of data in a map : **MapComponent**.
- Plot your data in customizable charts : **HistogramComponent**.

# How to use ?

```
$ npm install arlas-web-component --save
```

# API

* [Histogram](#Histogram)

## Histogram

A generic component that plots data in a chart. 

### Inputs : 

- `chartData: EventEmitter<Array<{key: any, value: any}>>` - Data to plot in the histogram. Please, check [data structure](#Data structure)
- `histogramType: string` - To be set to **timeline** when x axis represents time and **histogram** otherwise.
- `chartType: string` - Possible values are **area** and **bars**.
- `chartTitle: string` - The chart title.
- `chartWidth: number` - The chart width.
- `chartHeight: number` - The histogram height.
- `xTicks: number` - Number of ticks in the X axis.
- `yTicks: number` - Number of ticks in the Y axis.
- `dataUnit: string` - (Optional) Unit to add in the tooltip
- `customizedCssClass: string` - Css class name.

### Outputs : 

- `valuesChangedEvent: EventEmitter<{startvalue: any, endvalue: any}>` - Brush values end event.

### Data structure :

- The input data should be an array of `{ key: any, value: any }` object. 
- `key` represents the **X** axis values.
- `value` represents the **Y** axis values.
- When **X** axis values are **date** values, `key` should be given as timestamp and `[histogramType] = "'timeline'"`
