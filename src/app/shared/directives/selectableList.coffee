###
  Usage:

  <ul selectable-list="vm.someList" max-selectable="3">
      <li data-ng-repeat="foo in vm.foo" option="foo">
          <!-- Some Template -->
      </li>
  </ul>
###

selectableListPreCompiler = ($compile) ->
  "ngInject"
  restrict: 'A'
  priority: 2
  terminal: true
  compile: (element, attributes) ->
    selectables = attributes.selectables or 'li'

    unless attributes.ngModel
      element.attr 'ng-model', attributes.selectableList

    element.children(selectables).addClass 'dv-selectable'

    ###
        Since we're using TERMINAL compilation, we have to explicitly compile & link
        everything at a lower priority. This will compile the newly-injected ngModel
        directive as well as all the nested directives in the element.
    ###
    linkSubTree = $compile(element, null, 2)

    (scope) -> linkSubTree scope

selectableListPostCompiler = ($parse) ->
  "ngInject"
  restrict: 'A'
  require: 'ngModel'
  link: (scope, element, attrs, ngModelController) ->
    maxSelectable = scope.$eval(attrs.maxSelectable) or 0
    # 0 for unlimited selections
    selectionClass = 'dv-selected'
    disabledSelectionClass = 'dv-selection-disabled'
    selectableClass = '.dv-selectable'

    shallowCopy = (arr) ->
      copy = []
      angular.forEach arr, (item) ->
        copy.push item

      copy

    renderSelectedOptionsAsync = ->
      scope.$evalAsync renderSelectedOptions

    renderSelectedOptions = ->
      selectableOptions = element.find(selectableClass)
      selection = ngModelController.$viewValue
      maxSelectionReached = if maxSelectable then selection.length is maxSelectable else false

      handleSelection = (option) ->
        option = angular.element(option)
        value = getOptionValue(option)
        isSelected = selection.indexOf(value) >= 0

        if isSelected
          option.addClass selectionClass
        else if maxSelectionReached
          option.addClass disabledSelectionClass

        option.scope().$isSelected = isSelected

      selectableOptions
        .removeClass(selectionClass)
        .removeClass(disabledSelectionClass)

      angular.forEach selectableOptions, handleSelection

    toggleSelection = (event) ->
      scope.$apply ->
        option = angular.element(event.currentTarget)
        maxSelectionReached = if maxSelectable then maxSelectable is ngModelController.$viewValue.length else false

        if isOptionSelected(option)
          unSelectOption option
        else
          if maxSelectionReached
            scope.$eval attrs.onMaxSelectionReached
          else
            selectOption option

    isOptionSelected = (option) ->
      accessor = $parse('$isSelected')
      accessor option.scope()

    getOptionValue = (option) ->
      accessor = $parse(option.attr('option') or 'null')
      accessor option.scope()

    unSelectOption = (option) ->
      ###
          Making a copy since ng-model does not do a deep watch, $render() is only invoked if
          the values of $modelValue and $viewValue are actually different from their
          previous value.

          If $modelValue or $viewValue are objects (rather than a string or number) then
          $render() will not be invoked if you only change a property on the objects.
      ###
      selection = shallowCopy(ngModelController.$viewValue)
      value = getOptionValue(option)

      selection.splice selection.indexOf(value), 1
      ngModelController.$setViewValue selection

    selectOption = (option) ->
      selection = shallowCopy(ngModelController.$viewValue)
      value = getOptionValue(option)

      selection.push value
      ngModelController.$setViewValue selection

    element.on 'click', selectableClass, toggleSelection

    unless ngModelController.$viewValue
      ngModelController.$setViewValue []

    ngModelController.$render = renderSelectedOptionsAsync

    ngModelController.$isEmpty = (value) ->
      !value or value.length == 0

    scope.$watch (->
      ngModelController.$viewValue.length
    ), ->
      ngModelController.$render()

angular
    .module('diligenceVault')
    .directive('selectableList', selectableListPreCompiler)
    .directive('selectableList', selectableListPostCompiler)
