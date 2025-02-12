angular.module('diligenceVault').directive 'dvInputChangeAlert', ($state, SweetAlert, $timeout, $rootScope, $parse) ->
  restrict: 'A'
  require: 'ngModel'
  link: (scope, element, attrs, ngModelController) ->

    has_unsaved_changes = false
    ngModelValue = undefined
    route_change_nagger = undefined
    init_ng_model_value = undefined
    init_ng_model_value_set = false

    if attrs.dvInputAlertEntityType?
      input_entity_type = scope.$parent.$eval attrs.dvInputAlertEntityType

    ng_model_deregisterer = scope.$watch attrs['ngModel'], (newVal, oldVal) ->

      if !init_ng_model_value_set
        init_ng_model_value = newVal
        init_ng_model_value_set = true

      if newVal && newVal != oldVal
        ngModelValue = newVal
        if newVal != init_ng_model_value
          if !has_unsaved_changes
            triggerChangeWatcher()
        else
          if route_change_nagger?
            route_change_nagger()
          has_unsaved_changes = false
          if attrs.dvUnsavedChangesUpdateProperty?
            $parse(attrs.dvUnsavedChangesUpdateProperty).assign(scope.$parent, has_unsaved_changes)
      else if newVal == init_ng_model_value
        if route_change_nagger?
          route_change_nagger()
        has_unsaved_changes = false
        if attrs.dvUnsavedChangesUpdateProperty?
          $parse(attrs.dvUnsavedChangesUpdateProperty).assign(scope.$parent, has_unsaved_changes)

    triggerChangeWatcher = =>
      has_unsaved_changes = true

      if route_change_nagger?
        route_change_nagger()

      if attrs.dvUnsavedChangesUpdateProperty?
        $parse(attrs.dvUnsavedChangesUpdateProperty).assign(scope.$parent, has_unsaved_changes)

      route_change_nagger = scope.$on '$stateChangeStart', (event, toState, toParams) =>
        event.preventDefault()
        route_change_nagger()
        ng_model_deregisterer()
        type = if input_entity_type then input_entity_type else 'changes'
        SweetAlert.confirm({
          title: "You have unsaved "+type+" on this page"
          text: "All your unsaved "+type+" will be lost if you leave this page"
          cancelButtonText: 'Do Not Save'
          confirmButtonText: 'Save & Exit'
          showLoaderOnConfirm: true
          customClass: 'danger-on-cancel'
          showCloseButton: true
          reverseButtons: false
          preConfirm: =>
            $rootScope.$broadcast('dv_input_alert:save_changes')
            $timeout =>
              $state.go(toState.name, toParams)
            , 1000
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            $rootScope.$broadcast('dv_input_alert:leave_page')
            $timeout =>
              $state.go(toState.name, toParams)
              swal.close()
            , 1000

    scope.$on 'dv_input_alert:save_changes', (event) =>
      ng_model_deregisterer()
      if route_change_nagger?
        route_change_nagger()
      if has_unsaved_changes
        has_unsaved_changes = false
        scope.$eval attrs.dvOnInputSave
      if attrs.dvUnsavedChangesUpdateProperty?
        $parse(attrs.dvUnsavedChangesUpdateProperty).assign(scope.$parent, has_unsaved_changes)
      if swal
        swal.close()

    scope.$on 'dv_input_alert:leave_page', (event) =>
      ng_model_deregisterer()
      if route_change_nagger?
        route_change_nagger()
      if has_unsaved_changes
        has_unsaved_changes = false
      if attrs.dvUnsavedChangesUpdateProperty?
        $parse(attrs.dvUnsavedChangesUpdateProperty).assign(scope.$parent, has_unsaved_changes)
      if swal
        swal.close()

    element.on '$destroy', () ->
      has_unsaved_changes = false
      if ng_model_deregisterer?
        ng_model_deregisterer()
      if route_change_nagger?
        route_change_nagger()
      if attrs.dvUnsavedChangesUpdateProperty?
        $parse(attrs.dvUnsavedChangesUpdateProperty).assign(scope.$parent, has_unsaved_changes)
      if swal
        swal.close()
      element.off()
