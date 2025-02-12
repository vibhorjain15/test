angular.module('diligenceVault').directive 'dvRestrictInput', ->
  restrict: 'A'
  require: 'ngModel'
  link: (scope, element, attr, ctrl) ->
    if(!ctrl)
      return

    options = scope.$eval(attr.dvRestrictInput)
    if !options.regex and options.type
      switch options.type
        when 'digitsOnly'
          options.regex = '^[0-9]*$'
        when 'lettersAndDigitsOnly'
          options.regex = '^[a-zA-Z0-9]*$'
        when 'validPhoneCharsOnly'
          options.regex = '^[0-9 ()\+\-\.]*$'
        when 'alphaNumericPlus'
          #Letters, Numbers, Spaces, Underscore, Single Quote, Parenthesis, Comma, Hyphen, Period
          options.regex = "^[a-zA-Z0-9_'(),\-\. ]+$"
        when 'avoidFirstSplCharacter'
          options.regex = '^[^+@=\\-]|^$'
        when 'validName'
          #Valid windows file name refer: https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file
          #Also dont allow +,-,= and @ as the first character
          options.regex = /^(?!(?:COM[0-9]|CON|LPT[0-9]|NUL|PRN|AUX|com[0-9]|con|lpt[0-9]|nul|prn|aux)$|[\s\.=\+\-\@])[^\\\\\/:*"?<>|]{1,254}$/
        when 'validCityName'
          options.regex = '^([a-zA-Z\u0080-\u024F]+(?:. |-| |\'))*[a-zA-Z\u0080-\u024F]*$'
        when 'validZipcode'
          options.regex = '^[a-zA-Z0-9][a-zA-Z0-9\- ]{0,10}[a-zA-Z0-9]$'
        when 'validPersonName'
          options.regex = /^(?!.*[!@#$%^&*\"()_+=\[\]{}|\\;:<>?/~])(?!.*(?:\s{3}|\s{2}\s))\S[\S\s]{0,48}\S$/
        else
          options.regex = ''

    reg = new RegExp(options.regex)

    validateInput = (value) ->
      if value
        ctrl.$setValidity(options.type, reg.test(value))
      else
        ctrl.$setValidity(options.type, true)
      value

    ctrl.$formatters.push validateInput
    ctrl.$parsers.push validateInput
