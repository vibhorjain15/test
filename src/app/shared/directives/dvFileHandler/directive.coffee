angular.module('diligenceVault').directive 'dvFileHandler', ($compile) ->
  restrict: 'A'
  scope:
    dvPattern: '='
    dvAccept: '='
    dvMaxFileSize: '='
  terminal: true
  priority: 1000
  controller: 'DvFileHandlerController'
  controllerAs: 'vm'
  compile: (element, attrs) ->
    if angular.isDefined(attrs.dvDroppable)
      element.attr({
        'ngf-drop': ''
      })

    element.attr({
      'ngf-select': ''
      'ngf-model-invalid': 'vm.rejected_files'
      'dv-file-handler': null
      'ngf-change': 'vm.onFileSelect($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event)'
      'ngf-validate-fn': 'vm.fileValidator($file)'
    })

    (scope, lElem, lAttrs, controller) ->
      lElem.attr({
        'ngf-accept': '\'' + scope.dvAccept + '\''
        'ngf-pattern': '\'' + scope.dvPattern + '\''
        'ngf-max-size': '\'' + scope.dvMaxFileSize + '\''
      })
      $compile(lElem)(scope)
