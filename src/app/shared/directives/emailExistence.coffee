angular.module('diligenceVault').directive 'emailExistence', ($http, authenticationUrls, $q) ->
  require: 'ngModel'
  link: ($scope, element, attrs, ngModelController) ->
    _lookForEmailExistence = _.debounce(((modelValue, deferred) ->
      $http.get(authenticationUrls.verifyUsername,
        params: EmailID: modelValue
        skip_404_redirection: true)
      .then ((response) =>
        deferred.resolve()
      ), (error) ->
        deferred.reject() if error.status is 404
    ), 300)

    ngModelController.$asyncValidators.emailExistence = (modelValue) ->
      return unless modelValue

      deferred = $q.defer()

      _lookForEmailExistence modelValue, deferred

      deferred.promise
