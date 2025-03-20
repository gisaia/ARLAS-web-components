# arlas-map

**arlas-map** is an Angular library composed of cartographical components (map, legend, basemap, draw) dedicated to display ARLAS data.

The components are cartographical-framework-free; except for the draw where MapboxDraw is used.

The libarary also comes with a number of services. Those services provide cartographical interfaces that should be implemented according to your chosen map framework.



## Build

On the root of this repository, run

```shell
$ npm run build-map
```

## Publishing

After building your library with `ng build arlas-map`, go to the dist folder `cd dist/arlas-map` and run `npm publish`.

## Running unit tests

Run `ng test arlas-map` to execute the unit tests via [Karma](https://karma-runner.github.io).


## Maintaining the arlas-map library.

This section is a guide to follow in case you need to
- Add a new input to the map component.


### Add a new Input guide


In case you add a new input to the map component, make sure that all the implementation will take it into account.
