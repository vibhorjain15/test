angular.module('diligenceVault').directive 'menuItem', ($rootScope, $state, Utils,SweetAlert)->
  restrict: 'E'
  replace: true
  templateUrl: 'layout/directives/menuItem/template.html'
  require: '?^^menuItemPlus'
  compile: (element, attrs) ->
    uiSref = attrs.stateName
    is_freeSubscription = Utils.isFreeSubscription()
    is_manager = Utils.isManager()


    uiSref += "(#{attrs.stateParams})" if attrs.stateParams?
    $a = element.find('a')
    $button = element.find('button')

    $a.addClass(if angular.isDefined(attrs.subMenuItem) then 'sub-menu-item' else 'menu-item')

    if angular.isDefined(attrs.customClass)
      $a.addClass(attrs.customClass)

    if angular.isDefined(attrs.userIcon) and is_freeSubscription
      $button.addClass("display-inline-block")

    if attrs.modalName?
      if angular.isDefined(attrs.userIcon) and is_freeSubscription
        # $a.attr('ui-sref', 'app.premium')
      else
        $a.attr('role', 'button').attr('modal-button', attrs.modalName)
        if angular.isDefined(attrs.modalOptions)
          $a.attr('modal-options', attrs.modalOptions)
    else
      if angular.isDefined(attrs.userIcon) and is_freeSubscription and is_manager
        # $a.attr('ui-sref', 'app.premium')
      else
        $a.attr('ui-sref', uiSref)

    (scope, element, lAttr, menuItemPlusController) ->
      if menuItemPlusController?
        menuItemPlusController.register scope

      checkIfActive = ->
        menu_item = scope.menu_item
        menu_item.is_freeSubscription = is_freeSubscription
        menu_item.is_manager = is_manager

        currentStateName = $state.$current.name
        currentStateParams = $state.params

        is_active = (menu_item.matcher?.test(currentStateName)) or (currentStateName is menu_item.stateName)

        if menu_item.stateParams
          is_active = (is_active && _.isMatch(currentStateParams, menu_item.stateParams))

        scope.is_active = is_active

        menuItemPlusController.setActive() if menuItemPlusController?

      scope.closeMenu = ->
        $('.navbar-collapse').collapse('hide');
        if angular.isDefined(attrs.userIcon) and is_freeSubscription and is_manager
          SweetAlert.premiumAlert(
            {title:scope.menu_item.premiumTitle,text:scope.menu_item.premiumText}
            )



      scope.goToUpgradePage = ->
        $('.navbar-collapse').collapse('hide');
        $state.go "app.premium"

      checkIfActive()

      $rootScope.$on '$stateChangeSuccess', checkIfActive
