# ARLAS web components :

## About :
ARLAS-web-components is an Angular library that provides a set of data analytics components :

- **MapComponent**.
- **HistogramComponent**.

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
$ git clone https://gitlab.com/GISAIA.ARLAS/ARLAS-web-components.git .
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

*****TODO*****

### Running end-to-end tests

*****TODO*****

Before running the tests make sure you are serving the app via `ng serve`.

## Documentation : 
- Please find the documentation of all the components [here](src/components/components-documentation.md)

## Contributing :

- Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

# Authors :
- Gisaia - initial work - [Gisaïa](http://gisaia.fr/) 
- See also the list of [contributors](https://gitlab.com/GISAIA.ARLAS/ARLAS-web-components/graphs/develop) who participated in this project.

# License : 

- This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
