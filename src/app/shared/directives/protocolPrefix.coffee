angular.module('diligenceVault').directive 'protocolPrefix', ->
  restrict: 'A'
  require: 'ngModel'
  link: (scope, element, attrs, ngModelController) ->
    regex = /^(https?):\/\//i

    ensureProtocolPrefix = (value) ->
      missing_http = 'http://'.indexOf(value) is -1
      missing_https = 'https://'.indexOf(value) is -1

      if value and !regex.test(value) and (missing_http) and (missing_https)
        ngModelController.$setViewValue "https://#{value}"
        ngModelController.$render()

        "https://#{value}"
      else
        value

    ngModelController.$formatters.push ensureProtocolPrefix
    ngModelController.$parsers.push ensureProtocolPrefix
