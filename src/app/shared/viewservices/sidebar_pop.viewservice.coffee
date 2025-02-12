angular.module('diligenceVault').factory 'SidebarPopViewService',
  ($q, $log, $uibResolve, $rootScope, $controller, $compile, $templateRequest, $$stackedMap) ->
    new class SidebarPopViewService
      constructor: ->
        @opened_popups = $$stackedMap.createNew()

      getTemplatePromise: (options) ->
        if options.template
          $q.when(options.template)
        else
          if angular.isFunction(options.templateUrl)
            $templateRequest(options.templateUrl())
          else
            $templateRequest(options.templateUrl)

      removePopupWindow: (popup_instance) ->
        popup_window = @opened_popups.get(popup_instance).value
        closed_deferred = popup_window.closed_deferred
        scope = popup_window.scope

        @opened_popups.remove(popup_instance)
        popup_window.dom_el.remove()

        if (closed_deferred)
          closed_deferred.resolve()

        scope.$destroy()

      close: (popup_instance, result) ->
        popup_window = @opened_popups.get(popup_instance)

        if popup_window
          popup_window.value.deferred.resolve(result)

          @removePopupWindow(popup_instance)

          return true

        return false

      dismiss: (popup_instance, reason) ->
        popup_window = @opened_popups.get(popup_instance)

        if popup_window
          popup_window.value.deferred.reject(reason)

          @removePopupWindow(popup_instance)

          return true

        return false

      open: (options) ->
        popup_result_deferred = $q.defer()
        popup_closed_deferred = $q.defer()

        popup_instance =
          result: popup_result_deferred.promise
          closed: popup_closed_deferred.promise
          close: (result) =>
            @close(popup_instance, result)
          dismiss: (reason) =>
            @dismiss(popup_instance, reason)

        popup_options = angular.extend({}, options)
        popup_options.resolve ||= {}

        if (!popup_options.template && !popup_options.templateUrl)
          $log.error 'One of template or templateUrl options is required'

        template_and_resolve_promise = $q.all([
          @getTemplatePromise(popup_options),
          $uibResolve.resolve(popup_options.resolve, {}, null, null)
        ])

        template_and_resolve_promise.then (tpl_and_vars) =>
          provided_scope = popup_options.scope || $rootScope

          popup_scope = provided_scope.$new()
          popup_scope.title = options.title
          popup_scope.$close = popup_instance.close
          popup_scope.popup_instance = popup_instance
          popup_scope.$dismiss = popup_instance.dismiss
          popup_instance.setTitle = (title) ->
            popup_scope.title = title

          popup_scope.$on '$destroy', ->
            popup_scope.$dismiss()

          ctrl_locals = {}

          if popup_options.controller
            ctrl_locals.$scope = popup_scope
            ctrl_locals.$scope.$resolve = {}
            ctrl_locals.$dvSidebarPopupInstance = popup_instance
            angular.forEach tpl_and_vars[1], (value, key) ->
              ctrl_locals[key] = value
              ctrl_locals.$scope.$resolve[key] = value

            ctrlInstantiate = $controller(popup_options.controller, ctrl_locals, true,
                                          popup_options.controllerAs)

            if popup_options.controllerAs and popup_options.bindToController
              ctrl_instance = ctrlInstantiate.instance
              ctrl_instance.$close = popup_scope.$close
              ctrl_instance.$dismiss = popup_scope.$dismiss

              angular.extend ctrl_instance, {
                $resolve: ctrl_locals.$scope.$resolve
              }, provided_scope

            ctrl_instance = ctrlInstantiate()

          @render(popup_instance,
            scope: popup_scope
            deferred: popup_result_deferred
            closed_deferred: popup_closed_deferred
            content: tpl_and_vars[0]
          )
          popup_closed_deferred.resolve(true)
        , (reason) ->
          popup_result_deferred.reject(reason)

        popup_instance

      render: (popup_instance, popup) ->
        append_to_element = angular.element('body')
        el = angular.element("<div sidebar-popup></div>")

        @opened_popups.add(popup_instance, popup)

        el.html(popup.content)

        append_to_element.append $compile(el)(popup.scope)

        @opened_popups.top().value.dom_el = el
