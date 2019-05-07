# ARLAS web components :

[![Build Status](https://travis-ci.org/gisaia/ARLAS-web-components.svg?branch=develop)](https://travis-ci.org/gisaia/ARLAS-web-components)
[![npm version](https://badge.fury.io/js/arlas-web-components.svg)](https://badge.fury.io/js/arlas-web-components)

## About :
ARLAS-web-components is an Angular library that provides a set of data analytics components.

## Installing :

To install this library in your npm Angular web app project add the dependency in your package.json :

```shell
$ npm install arlas-web-component --save
```

## Documentation : 
Please find the documentation of all the components [here](http://docs.arlas.io/arlas-tech/current/classes/_components_donut_donut_component_.donutcomponent/)

## Build :

To build the project you need to have installed
- [Node](https://nodejs.org/en/) version >= 8.0.0 
- [npm](https://github.com/npm/npm) version >= 5.2.0
- [Angular CLI](https://github.com/angular/angular-cli) version 7.0.2
  ```
  $ npm install -g @angular/cli@7.0.2
  ```

Then, clone the project

```shell
$ git clone https://github.com/gisaia/ARLAS-web-components
```

Move to the folder

```shell
$ cd ARLAS-web-components
```

Install all the project's dependencies

```shell
$ npm install
```

Build the project with `ngc` and `gulp` :

```shell
$ npm run build-release
```

The build artifacts will be generated in the `dist/` directory. 


## Run / Deployment : 

Check out the ARLAS web components by running the demo application of this library on a dev server  :

```shell
$ ng serve 
```

Navigate to [http://localhost:4200/](http://localhost:4200/).

 The app will automatically reload if you change any of the source files.

## Tests : 
### Running unit tests

```shell
$ ng test
```

## Contributing :

- Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

# Versioning :

We use our own versioning schema which looks like x.y.z where :

- `x` : Incremented as soon as the `ARLAS-server API` changes
- `y` : Incremented as soon as an `ARLAS-web-components` inputs or outputs change.
- `z` : Incremented as soon as the `ARLAS-web-components` implementation receives a fix or an enhancement.

# Authors :

- Gisaia - initial work - [Gisaïa](http://gisaia.fr/) 

See also the list of [contributors](https://github.com/gisaia/ARLAS-web-components/graphs/contributors) who participated in this project.

# License : 

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE.txt](https://github.com/gisaia/ARLAS-web-components/blob/develop/LICENSE.txt) file for details.

# Acknowledgments : 

This project has been initiated and is maintained by Gisaïa
