angular.module('diligenceVault').directive 'displayQuestionnaire', ($templateCache, $timeout, $compile, Utils, LayoutUtils, $rootScope) ->
  restrict: 'E'
  templateUrl: 'shared/directives/rbComponents/rbQuestionnaire/displayQuestionnaire/template.html'
  scope: true
  controller: 'DisplayQuestionnaireController'
  controllerAs: 'vm'
  link: (scope, element) ->
    $sidebar_panel = element.find('#js-sidebar-panel')
    $body = $('body')
    container_tpl = $templateCache.get('diligence/project/questionnaire/new_directives/questionnaire/sidebar-container.html')

    renderSection = (section, $container) ->
      $timeout ->
        child_scope = angular.extend(scope.$new(), {section: section})
        directive = '<questionnaire-section></questionnaire-section>'

        $container.append $compile(directive)(child_scope)
        element.find('.js-spinner').remove()
        $container.removeClass('hidden')
      , 50

    ###
      Even if you are rendering 100s of sections, user won't perceive a lag because the
      browser won't hangout since we are queing timeouts
    ###
    scope.renderSections = (sections) ->
      $container = element.find('.js-questionnaire-form')

      if sections.length
        promise = _(sections).reduce (result, section) ->
          if result?
            result.then ->
              renderSection(section, $container)
          else
            renderSection(section, $container)
        , null

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

    scope.removeSidebarPanel = ->
      $sidebar_panel.removeClass('in')
      $timeout ->
        $sidebar_panel.empty()
        $body.removeClass('noscroll')
        $(".js-sidebar-mask").remove()
      , 500 #500ms is the transition time that is defined in css

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
      $sidebar_panel.find('.js-sidebar-reference').text(sidebarReference)
      $sidebar_panel.find('.js-sidebar-template-content').html(sidebar_content)

      $sidebar_panel.addClass('in')

      $body.addClass('noscroll')
      $body.append('<div class="mask fixed js-sidebar-mask"></div>')
