angular.module('diligenceVault').directive 'uniqueEmail', ($http, authenticationUrls, $q) ->
  require: 'ngModel'
  link: ($scope, element, attrs, ngModelController) ->
    _lookForUniqueEmail = _.debounce(((modelValue, deferred) ->
      $http.get(authenticationUrls.verifyUsername,
        params: EmailID: modelValue
        skip_404_redirection: true)
      .then ((response) =>
        deferred.reject()
      ), (error) ->
        deferred.resolve() if error.status is 404
    ), 300)

    ngModelController.$asyncValidators.uniqueEmail = (modelValue) ->
      return unless modelValue

      deferred = $q.defer()

      _lookForUniqueEmail modelValue, deferred

      deferred.promise
