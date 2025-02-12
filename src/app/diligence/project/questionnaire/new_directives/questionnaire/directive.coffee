angular.module('diligenceVault').directive 'questionnaire', ($templateCache, $timeout, $compile, Utils, LayoutUtils, $rootScope, SweetAlert) ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaire/template.html'
  scope: true
  controller: 'QuestionnaireController'
  controllerAs: 'vm'
  link: (scope, element, attrs) ->
    $sidebar_panel = element.find('#js-sidebar-panel')
    printPreview = angular.isDefined attrs.printPreview
    if printPreview
      directive = '<questionnaire-section print-preview></questionnaire-section>'
    else
      directive = '<questionnaire-section></questionnaire-section>'
    $body = $('body')
    container_tpl = $templateCache.get('diligence/project/questionnaire/new_directives/questionnaire/sidebar-container.html')

    renderSection = (section, $container) ->
      jQuery("html, body").animate({ scrollTop: 0 }, "slow")
      $timeout ->
        child_scope = angular.extend(scope.$new(), {section: section})

        $container.append $compile(directive)(child_scope)
        element.find('.js-spinner').remove()
        $container.removeClass('hidden')
      , 50

    scope.renderSection = (section)=>
      $container = element.find('.js-questionnaire-form')
      renderSection(section,$container)
    ###
      Even if you are rendering 100s of sections, user won't perceive a lag because the
      browser won't hangout since we are queing timeouts
    ###
    scope.renderSections = (sections) ->
      total_questions = 0
      _(sections).each (section_item) =>
        total_questions += section_item.questions.length
      $rootScope.$emit 'questionnaire:total_questions', total_questions

      $container = element.find('.js-questionnaire-form')

      promise = _(sections).reduce (result, section) ->
        if result?
          result.then ->
            renderSection(section, $container)
        else
          renderSection(section, $container)
      , null

      if promise
        promise.then ->
          $timeout ->
            ###if Utils.isFirstDD()
              LayoutUtils.triggerHelp()###
            $rootScope.$emit 'questionnaire:render'
          , 50

      else
        $timeout ->
          element.find('.js-spinner').remove()
          $container.removeClass('hidden')
          $rootScope.$emit 'questionnaire:no-results'
        , 50

    scope.closeSidebarPanel = ->
      $sidebar_panel.removeClass('in')
      $timeout ->
        $sidebar_panel.empty()
        $body.removeClass('noscroll')
        $(".js-sidebar-mask").remove()
      , 500 #500ms is the transition time that is defined in css

    scope.removeRenderedSection = (section)=>
      $container = element.find('.js-questionnaire-form')
      $container.find('#child_section_'+section.id).scope().$destroy() if $container.find('#child_section_'+section.id).scope()
      $container.find('#child_section_'+section.id).remove()

    scope.removeSidebarPanel = ->
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
            customClass: 'danger-on-cancel'
            showCloseButton: true
            reverseButtons: false
            showLoaderOnConfirm: true
            preConfirm: =>
              $rootScope.$broadcast('dv_input_alert:save_changes')
              $timeout =>
                scope.closeSidebarPanel()
                swal.close()
              , 1000
          }).then (isConfirm) =>
            if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
              $rootScope.$broadcast('dv_input_alert:leave_page')
              $timeout =>
                scope.closeSidebarPanel()
                swal.close()
              , 1000
        else
          scope.closeSidebarPanel()
      else
        scope.closeSidebarPanel()

    scope.displaySidebarPanel = (title, sidebarReference, templateUrl, contentFor, readonly) ->
      sidebar_template = $templateCache.get(templateUrl)
      sidebar_content = $compile(sidebar_template)(scope)

      switch contentFor
        when 'followup'
          class_name = 'has-follow-up-form'
        when 'todo'
          class_name = 'has-todo-form'
        when 'notes'
          class_name = 'has-notes-form'
        when 'blackline'
          class_name = 'has-blackline-form'

      class_name += ' read-only-mode' if readonly

      $sidebar_panel.html $compile(container_tpl)(scope)
      $sidebar_panel.find('.js-sidebar-title').text(title)
      $sidebar_panel.find('.panel-body').addClass(class_name)
      $sidebar_panel.find('.js-sidebar-reference').html(sidebarReference)
      $sidebar_panel.find('.js-sidebar-template-content').html(sidebar_content)

      $sidebar_panel.addClass('in')

      $body.addClass('noscroll')
      $body.append('<div class="mask fixed js-sidebar-mask"></div>')

    scope.$on '$destroy', ()=>
      scope.deregigisterSequenceSave()
      scope.deregisterResponseSave()
      scope.deregisterRevertChanges()
      scope.deregistererRefresh()
