# Contributing to ARLAS-web-components

ARLAS-web-components is an open source project and there are many ways to contribute.

## Bug reports

If you think you have found a bug in ARLAS-web-components, first make sure that it has not been already addressed in our
[issues list](https://github.com/gisaia/ARLAS-web-components/issues).

If not, provide as much information as you can to help us reproduce your bug :

- Add error messages to the issue desctiption.
- Add a screenshot to the issue description if the bug has visual effects.
- Describe the maneuver that triggers the bug.
- You can use the `component`-demo component to reproduce it.

Keep in mind that we will fix your problem faster if we can easily reproduce it.

## Feature requests

If you think a component lacks a feature, do not hesitate to open an issue on our
[issues list](https://github.com/gisaia/-web-components/issues) on GitHub which describes what you need, why you need it,
and how it should work.

## Contributing code and documentation changes

If you want to submit a bugfix or a feature implementation, first find or open an issue about it on our
[issues list](https://github.com/gisaia/ARLAS-web-components/issues)

#### Prerequisites

ARLAS-web-component is an Angular project. You need Node/npm or yarn to be installed.
Codebase follows [Visual Studio Code](https://code.visualstudio.com/) default formatting rules.

#### Fork and clone the repository

You will need to fork the main ARLAS-web-components repository and clone it to your local machine. See
[github help page](https://help.github.com/articles/fork-a-repo) for help.

#### Add a new component

All components are organized in folders in `src/components` :

      - ng generate component [yourComponent]
      - mv src/app/yourComponent src/components
      - Update the path to your component in the App Module

- In `yourComponent` folder, add a json schema that describes the component's inputs.
- In `yourComponent` folder, create an Angular module that imports your component.
- Export your module in `src/components/index.ts`
- In this module, never import BrowserModule. You can import Common Module instead
- Do not mix components/directives/pipes and services in the same module. Because :
    - A service provided in a module will be available everywhere in the app, so your module should be imported only once, in the user app root module.
    - An exported component/directive/pipe will only be available in the module importing yours, so your module should be imported in every user module (root and/or feature modules) that need them (like the CommonModule).
- Never use browser-specific APIs (like the DOM) directly.
- Create a demo for your component in `src/app/yourComponent-demo`.  


#### Submitting your changes

When your code is ready, you will have to :

- rebase your repository.
- run `ng test`, `ng lint`, `ng run build-release` and `mkdocs.sh` and make sure they all pass.
- [submit a pull request](https://help.github.com/articles/using-pull-requests) with a proper title and a mention to
the corresponding issue (eg "fix #1234").
- never force push your branch after submitting, if you need to sync with official repository, you should better merge
master into your branch.
