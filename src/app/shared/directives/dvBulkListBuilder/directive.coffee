angular.module('diligenceVault').directive 'dvBulkListBuilder', ($timeout) ->
  restrict: 'E'
  scope: true
  require: 'ngModel'
  template: '<textarea data-ng-model="listNames" class="form-control" style="height: 10em;" data-ng-list="&#10;" data-ng-trim="false" ng-attr-placeholder="{{placeHolderText}}" data-ng-required="required" data-ng-change="onStepsChange()" ></textarea>'
  link: (scope, element, attrs, ngModel) ->
    mainValueList = []
    scope.currentLength = scope.$parent.$eval attrs.currentLength
    scope.placeHolderText = ""
    scope.required = scope.$parent.$eval attrs.valueRequired
    # It can we subcategory_id in subcategories controller,
    # category_id in category controler and so on
    scope.mainId = scope.$parent.$eval attrs.mainId
    # ------------------------------------------------
    scope.type = scope.$parent.$eval attrs.type
    keyForText = scope.$parent.$eval attrs.textKey
    keyForId = scope.$parent.$eval attrs.idKey


    # This function is used to process all
    # the options that are in listNames array
    # We call this function manually, If Enter is pressed we need to apply this to current digestion cycle
    # otherwise just set it equal to processed list
    processListNames = (enterPressed) =>
      newListNames = []
      # each element inside listNames is like type+ numerOfCurrentElementInlistNames+ ValueEnteredByUser
      # So we remove all extra stuff and just keep the value entered by user
      _(scope.listNames).each ((list,index)=>
        trimmedList = list.trim()
        if trimmedList.length > 0
          newIndex = Number(scope.currentLength) + index + 1
          searchString = scope.type + newIndex + ": "
          if not trimmedList.startsWith(searchString)
            list = searchString + trimmedList
          newListNames.push list
      )
      if enterPressed
        scope.$apply(()=>
          scope.listNames = newListNames
        )
      else
        scope.listNames = newListNames

    scope.$parent.$watch attrs.ngModel, (value) =>
      if value?
        mainValueList = scope.$parent.$eval attrs.ngModel
        if mainValueList.length
          scope.listNames = _(mainValueList).pluck keyForText
          processListNames()
        else
          scope.listNames = mainValueList


    scope.$parent.$watch attrs.currentLength, (value) =>
      if value?
        scope.currentLength = scope.$parent.$eval attrs.currentLength

    # if the last character of the string is 'y'
    # then replace it with 'ies'
    # else just add 's'
    if scope.type.slice(-1) == 'y'
      scope.placeHolderText = "Add multiple " + scope.type.slice(0, -1) + "ies here"
    else
      scope.placeHolderText = "Add multiple " + scope.type + "s here"
    # ----------------------------------------------------------

    scope.$on 'changed:responseType', (evt, data) =>
      if data
        scope.listNames = _(data).pluck keyForText
        processListNames()
      else
        scope.onStepsChange()

    $(element).find('textarea').keypress (event,value)=>
      # When 'Enter' key is pressed
      if (event.which == 13 or event.keyCode == 13)
        processListNames(true)

    # This function is called with ng-change in textarea
    # Here we also remove all extra character and keep the value entered by user
    scope.onStepsChange = ()=>
      if !scope.listNames
        return

      newListNamesWithoutPrefix =
      _(scope.listNames).each ((list,index)=>
        trimmedList = list.trim()
        if trimmedList.length > 0
          newIndex = Number(scope.currentLength) + index + 1
          searchString = scope.type + newIndex + ": "
          listObj = {}

          if scope.mainId
            listObj[keyForId] = scope.mainId

          if scope.type == 'option'
            listObj.type = 'text'
            listObj.type_options = {type:'text'}

          if not trimmedList.startsWith(searchString)
            listObj[keyForText] = trimmedList
          else
            listWithoutPrefix = trimmedList.substr(searchString.length)
            listObj[keyForText] = listWithoutPrefix
          mainValueList[index] = listObj
      )
      mainValueList.length = scope.listNames.length
