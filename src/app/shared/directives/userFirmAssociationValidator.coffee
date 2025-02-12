angular.module('diligenceVault').directive 'validateUserFirmAssociation', (Restangular, $q, $timeout) ->
  require: 'ngModel'
  scope:
    validateUserFirmAssociation: '='
    existingFirm: '='
  link: ($scope, element, attrs, ngModelController) ->
    validateIfUserBelongsToFirm = (modelValue, deferred) ->
      Restangular.all('v2/contacts').customGET('', {'email': modelValue}).then ((response) ->
        if response and response.length
          $scope.existingFirm = response[0].firm_name
          $timeout =>
            return deferred.reject(response[0])
        else
          return deferred.resolve(response)
        # if response.firmInfo == null or $scope.validateUserFirmAssociation == response.firmInfo?.id
        #   return deferred.resolve(response)
        # else
        #   $scope.existingFirm = response[0].firm_name
        #   $timeout =>
        #     return deferred.reject(response[0])
      ), (error) ->
        deferred.resolve() if error.status is 404

    ngModelController.$asyncValidators.validateUserFirmAssociation = (modelValue) ->
      return unless modelValue

      deferred = $q.defer()

      validateIfUserBelongsToFirm modelValue, deferred

      return deferred.promise
