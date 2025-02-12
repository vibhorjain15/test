angular.module('diligenceVault').directive 'dvImagePicker', (ImageDataService) ->
  templateUrl: 'shared/directives/dvImagePicker/template.html'
  controller: 'DVImagePickerController'
  controllerAs: 'vm'
  scope: true
  require: ['ngModel', 'dvImagePicker']
  link: (scope, element, attrs, controllers) ->
    [ngModel, dvImagePickerController] = controllers

    ngModel.$render = ->
      id = parseInt(@$viewValue)
      image = dvImagePickerController.getImageById(id)

      # image is not available in the current loaded ones
      if (id? not isNaN(id)) and !image
        ImageDataService.getImage(id).then (response) ->
          image = response

          dvImagePickerController.addImageToTop(image)

      dvImagePickerController.select(image)

    scope.$setSelection = (id) ->
      ngModel.$setViewValue(id)
