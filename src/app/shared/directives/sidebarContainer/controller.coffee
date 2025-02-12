class SidebarContainerController extends BaseController
  @register 'SidebarContainerController'
  @inject 'SidebarViewService', '$scope'

  initialize: ->
    @SidebarViewService.register(@)

  setTitle: ->
    @$scope.apply(@$scope, arguments)

  close: ->
    @active_sidebar.close()

  hide: ->
    @$scope.resetSize(@size)
    @$scope.enableBodyScroll()
    @$scope.removeMask()

    @display_sidebar = false
    @active_sidebar = null
    @size = null

  getActiveSidebar: ->
    @active_sidebar

  render: (html_content, sidebar) ->
    @display_sidebar = true
    @active_sidebar = sidebar

    @$scope.setContent(html_content)

  setSize: (size) ->
    @size = size

    @$scope.setSize(size)

  setClass: (class_name) ->
    @$scope.setClass(class_name) if class_name?

  removeClass: (class_name) ->
    @$scope.removeClass(class_name) if class_name?
