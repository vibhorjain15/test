angular.module('diligenceVault').directive 'sidebarContainer', ->
  restrict: 'E'
  controller: 'SidebarContainerController'
  controllerAs: 'vm'
  templateUrl: 'shared/directives/sidebarContainer/template.html'
  link: (scope, element) ->
    $mask = null
    $body = $('body')
    $sidebar_panel = element.find('.js-sidebar-panel')
    $title_container = element.find('.js-sidebar-title')
    $sidebar_content_container = element.find('.js-sidebar-content-container')

    # since sidebar lives throughout the application's lifecycle
    # deliberately avoiding title $watch under template
    scope.setTitle = (title) ->
      $title_container.text(title)

    scope.setClass = (class_name) ->
      $sidebar_content_container.addClass(class_name)

    scope.removeClass = (class_name) ->
      $sidebar_content_container.removeClass(class_name)

    scope.setContent = (html_content) ->
      $mask = $("<div class='mask fixed'></div>")

      $sidebar_content_container.append(html_content)

      $body.addClass('noscroll')
      $body.append($mask)

    scope.enableBodyScroll = ->
      $body.removeClass('noscroll')

    scope.removeMask = ->
      $mask.remove()
      $mask = null

    scope.setSize = (size) ->
      $sidebar_panel.addClass("sidebar-#{size}")

    scope.resetSize = (size) ->
      $sidebar_panel.removeClass("sidebar-#{size}")
