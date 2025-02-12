## Frontend Build
Make sure you have `node`, `npm`, `bower` & `grunt-cli` installed

### if install/build is failing then try below steps

1. rm package-lock.json
2. rm -r node_modules
3. bower install && npm install --legacy-peer-deps

### For Development
```
$ npm install
$ bower install
$ grunt init
```
Want to create custom build for tinymce? Head over to https://github.com/mudassir0909/tinymce

### For generating build for staging
```
$ git checkout staging
$ git merge master
$ chmod 777 build.sh
$ ./build.sh
```

## Generating frontend build for private instances

[Visit this Wiki Page](https://github.com/DiligenceVault/DV_MVC_REST/wiki/Generating-frontend-build-for-private-instances)

## Generating Docs
```
$ grunt docs
```
Once this task runs, you can see the docs by visiting [http://localhost:8080](http://localhost:8080)

## Modifying Docs
We use [Grunt Docular](http://grunt-docular.com/) for documentation generation.

```
$ grunt docs
```
In addition to above command, also run
```
$ grunt watch:docs
```
This command keeps compiling docs as you change coffeescript files

[Writing Docular docs](https://github.com/Vertafore/docular/blob/master/docs/writing/index.md)

[Writing AngularJS Documentation](https://github.com/angular/angular.js/wiki/Writing-AngularJS-Documentation)
