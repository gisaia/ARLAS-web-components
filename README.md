# ARLAS web components :

[![Build Status](https://travis-ci.org/gisaia/ARLAS-web-components.svg?branch=develop)](https://travis-ci.org/gisaia/ARLAS-web-components)
[![npm version](https://badge.fury.io/js/arlas-web-components.svg)](https://badge.fury.io/js/arlas-web-components)

## About :
ARLAS-web-components is an Angular library that provides a set of data analytics components.

## Prerequisites :

[Node](https://nodejs.org/en/) version 8.0.0

```
$ sudo npm install n -g
$ sudo n 8.0.0
```
[npm](https://github.com/npm/npm) version 5.2.0
````
$ npm install npm@5.2.0 -g
````
[Angular CLI](https://github.com/angular/angular-cli) version 1.2.0.
```
$ npm install -g @angular/cli@1.2.0
```
[webpack](https://webpack.js.org/) version 2.4.1
```
$ npm install -g webpack@2.4.1
```
[Gulp](http://gulpjs.com/) version 3.9.1
```
$ npm install -g gulp@3.9.1
```
## Installing :

To install this library in your npm Angular web app project add the dependency in your package.json :
```
$ npm install arlas-web-component --save
```
## Build :
Clone project

```
$ git clone https://github.com/gisaia/ARLAS-web-components
```

Move into the folder

```
$ cd ARLAS-web-components
```

Get all project's dependencies

```
$ npm install
```

Build the project with ngc and gulp :

```
$ npm run build-release
```

The build artifacts will be stored in the `dist/` directory. 


## Run / Deployment : 

To run the demo application of this library on dev server  :

```
$ ng serve 
```
Navigate to [http://localhost:4200/](http://localhost:4200/). The app will automatically reload if you change any of the source files.

## Tests : 
### Running unit tests

```
$ ng test
```

## Documentation : 
- Please find the documentation of all the components [here](http://arlas.io/arlas-tech/current/classes/_histogram_histogram_component_.histogramcomponent/)

## Contributing :

- Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

# Versioning :

We use our own versioning schema which looks like x.y.z where :

- `x` : Incremented as soon as the `ARLAS Server API` changes
- `y` : Incremented as soon as an `ARLAS-web-components` inputs or outputs change
- `z` : Incremented as soon as the `ARLAS-web-components` implementation receives a fix

# Authors :

- Gisaia - initial work - [Gisaïa](http://gisaia.fr/) 

See also the list of [contributors](https://github.com/gisaia/ARLAS-web-components/graphs/contributors) who participated in this project.

# License : 

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE.txt](https://github.com/gisaia/ARLAS-web-components/blob/develop/LICENSE.txt) file for details.

# Acknowledgments : 

This project has been initiated and is maintained by Gisaïa
