angular.module('diligenceVault').directive 'dvDecimalInput', ->
  {
    restrict: 'A'
    require: 'ngModel'
    link: (scope, element, attrs, ngModel) ->
      # watch for value in ng model
      scope.$watch attrs.ngModel, (newValue, oldValue) ->
        if newValue == undefined
          return
        # create array from new value
        spiltArray = String(newValue).split('')
        # if allowNegative is false then replace '-' sign with ''
        if attrs.allowNegative == 'false'
          if spiltArray[0] == '-'
            newValue = newValue.replace('-', '')
            # set view value as new value
            ngModel.$setViewValue newValue
            # reder the dom
            ngModel.$render()
        if attrs.allowDecimal == 'false'
          newValue = parseInt(newValue)
          ngModel.$setViewValue newValue
          ngModel.$render()
        if attrs.allowDecimal != 'false'
          if attrs.decimalUpto
            # create new array with the values after decimal
            newval1 = String(newValue).split('.')
            if newval1[1]
              # slice values after specified decimal point
              newval2 = newval1[1].slice(0, attrs.decimalUpto)
              # create new value with join before deciaml and after decimal
              newValue = [
                newval1[0]
                newval2
              ].join('.')
              # set view value
              ngModel.$setViewValue newValue
              # render
              ngModel.$render()
        # return if split array length is 0
        if spiltArray.length == 0
          return
        # return if length is 1 and first element is minus or decimal
        if spiltArray.length == 1 and (spiltArray[0] == '-' or spiltArray[0] == '.')
          return
        if spiltArray.length == 2 and newValue == '-.'
          return

        #Check it is number or not
        if isNaN(newValue)
          ngModel.$setViewValue oldValue
          ngModel.$render()
        return
      return

  }
