angular.module('diligenceVault').directive 'validateEmail', ->
  require: 'ngModel'
  link: ($scope, element, attrs, ngModelController) ->
    EMAIL_REGEXP = `/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/`

    # only apply the validator if ngModel is present and Angular has added the email validator
    if ngModelController and ngModelController.$validators.email
      # this will overwrite the default Angular email validator

      ngModelController.$validators.email = (modelValue) ->
        ngModelController.$isEmpty(modelValue) or EMAIL_REGEXP.test(modelValue)
