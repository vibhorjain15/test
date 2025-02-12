angular.module('diligenceVault').factory 'SidebarViewService',
  ($q, $log, $uibResolve, $rootScope, $controller, $compile, $templateRequest, $$stackedMap, SweetAlert, $timeout) ->
    new class SidebarViewService
      constructor: ->
        @opened_sidebars = $$stackedMap.createNew()

      register: (sidebar_container) ->
        @sidebar_container = sidebar_container

      getTemplatePromise: (options) ->
        if options.template
          $q.when(options.template)
        else
          if angular.isFunction(options.templateUrl)
            $templateRequest(options.templateUrl())
          else
            $templateRequest(options.templateUrl)

      removeSidebarWindow: (sidebar_instance) ->

        sidebar_window = @opened_sidebars.get(sidebar_instance).value
        closed_deferred = sidebar_window.closed_deferred
        scope = sidebar_window.scope

        closeSidebarFn = () =>
          @opened_sidebars.remove(sidebar_instance)
          @sidebar_container.hide()
          sidebar_window.dom_el.remove()

          if (closed_deferred)
            closed_deferred.resolve()

          scope.$destroy()

        if scope.hasOwnProperty('has_unsaved_changes')
          scope_has_unsaved_changes = false
          for key of scope.has_unsaved_changes
            if scope.has_unsaved_changes.hasOwnProperty(key)
              if scope.has_unsaved_changes[key]
                scope_has_unsaved_changes = true
                break
          if scope_has_unsaved_changes
            SweetAlert.confirm({
              title: "You have unsaved changes on this page"
              text: "All your unsaved changes will be lost if you leave this page"
              cancelButtonText: 'Do Not Save'
              confirmButtonText: 'Save & Exit'
              showLoaderOnConfirm: true
              customClass: 'danger-on-cancel'
              showCloseButton: true
              reverseButtons: false
              preConfirm: =>
                $rootScope.$broadcast('dv_input_alert:save_changes')
                $timeout =>
                  closeSidebarFn()
                  swal.close()
                ,1000
            }).then (isConfirm) =>
              if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
                $rootScope.$broadcast('dv_input_alert:leave_page')
                $timeout =>
                  closeSidebarFn()
                  swal.close()
                ,1000
          else
            closeSidebarFn()
        else
          closeSidebarFn()

      close: (sidebar_instance, result) ->
        sidebar_window = @opened_sidebars.get(sidebar_instance)

        if sidebar_window
          sidebar_window.value.deferred.resolve(result)

          @removeSidebarWindow(sidebar_instance)

          return true

        return false

      dismiss: (sidebar_instance, reason) ->
        sidebar_window = @opened_sidebars.get(sidebar_instance)

        if sidebar_window
          sidebar_window.value.deferred.reject(reason)

          @removeSidebarWindow(sidebar_instance)

          return true

        return false

      closeIfAnyActiveSidebar: ->
        active_sidebar = @sidebar_container.getActiveSidebar()

        if active_sidebar?
          @close(active_sidebar)

      open: (options) ->
        @closeIfAnyActiveSidebar()

        sidebar_result_deferred = $q.defer()
        sidebar_closed_deferred = $q.defer()

        sidebar_instance =
          result: sidebar_result_deferred.promise
          closed: sidebar_closed_deferred.promise
          close: (result) =>
            @close(sidebar_instance, result)
          dismiss: (reason) =>
            @dismiss(sidebar_instance, reason)

        sidebar_options = angular.extend({}, options)
        sidebar_options.resolve ||= {}

        if (!sidebar_options.template && !sidebar_options.templateUrl)
          $log.error 'One of template or templateUrl options is required'

        template_and_resolve_promise = $q.all([
          @getTemplatePromise(sidebar_options),
          $uibResolve.resolve(sidebar_options.resolve, {}, null, null)
        ])

        template_and_resolve_promise.then (tpl_and_vars) =>
          provided_scope = sidebar_options.scope || $rootScope

          @sidebar_container.setSize(sidebar_options.size)

          sidebar_scope = provided_scope.$new()
          sidebar_scope.$close = sidebar_instance.close
          sidebar_scope.sidebar_instance = sidebar_instance
          sidebar_scope.$dismiss = sidebar_instance.dismiss
          sidebar_instance.setTitle = (title) =>
            sidebar_scope.title = title
            @sidebar_container.setTitle(title)

          @sidebar_container.setClass(options.custom_class)

          sidebar_scope.setTitle(options.title)
          sidebar_scope.$on '$destroy', =>
            sidebar_scope.$dismiss()
            @sidebar_container.removeClass(options.custom_class)

          ctrl_locals = {}

          if sidebar_options.controller
            ctrl_locals.$scope = sidebar_scope
            ctrl_locals.$scope.$resolve = {}
            ctrl_locals.$dvSidebarInstance = sidebar_instance
            angular.forEach tpl_and_vars[1], (value, key) ->
              ctrl_locals[key] = value
              ctrl_locals.$scope.$resolve[key] = value

            ctrlInstantiate = $controller(sidebar_options.controller, ctrl_locals, true,
                                          sidebar_options.controllerAs)

            if sidebar_options.controllerAs and sidebar_options.bindToController
              ctrl_instance = ctrlInstantiate.instance
              ctrl_instance.$close = sidebar_scope.$close
              ctrl_instance.$dismiss = sidebar_scope.$dismiss

              angular.extend ctrl_instance, {
                $resolve: ctrl_locals.$scope.$resolve
              }, provided_scope

            ctrl_instance = ctrlInstantiate()

          @render(sidebar_instance,
            scope: sidebar_scope
            deferred: sidebar_result_deferred
            closed_deferred: sidebar_closed_deferred
            content: tpl_and_vars[0]
          )
          sidebar_closed_deferred.resolve(true)
        , (reason) ->
          sidebar_result_deferred.reject(reason)

        sidebar_instance

      render: (sidebar_instance, sidebar) ->
        el = angular.element('<div class="dv-sidebar"></div>')

        @opened_sidebars.add(sidebar_instance, sidebar)

        el.html(sidebar.content)

        @sidebar_container.render($compile(el)(sidebar.scope), sidebar_instance)

        @opened_sidebars.top().value.dom_el = el
