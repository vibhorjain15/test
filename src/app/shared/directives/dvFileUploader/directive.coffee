# image,doc,excel,powerpoint,pdf

angular.module('diligenceVault').directive 'dvFileUploader', ->
  templateUrl: 'shared/directives/dvFileUploader/template.html'
  controller: 'DVFileUploaderController'
  controllerAs: 'vm'
  scope: true
