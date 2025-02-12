class ReportPageController extends BaseController
  @register 'ReportPageController'
  @inject 'RbComponentFactory', '$scope', '$timeout', 'toaster', 'SweetAlert'

  initialize: ->
    @initSortable()

  initSortable: ->
    @sortableOptions =
      axis: 'y'
      handle: '.js-sort-handle'
      cursor: 'move'
      placeholder: 'sortable-placeholder'
      cancel: '' #http://stackoverflow.com/a/12146273/1482899, https://api.jqueryui.com/sortable/#option-cancel
      stop: =>
        @$scope.onComponentUpdate()

  setPage: (page) ->
    @page = page
    @components = page.components

  onComponentUpdate: ->
    @$scope.onComponentUpdate()

  insertComponent: (component_type, idx) ->
    component = @RbComponentFactory.createNewComponent(component_type)

    if idx?
      @components.splice(idx, 0, component)
    else
      @components.push(component)

    @onComponentUpdate()

    @$scope.deactivateComponent()

    if activate_component_timeout
      activate_component_timeout.cancel()

    activate_component_timeout = @$timeout =>
      @activateAndScrollToComponent("#rc-"+(idx))

  removeComponent: (component) =>
    idx = @components.indexOf(component)
    @components.splice(@components.indexOf(component), 1)

    @onComponentUpdate()

    @$scope.deactivateIfActiveComponent(component)

    if idx>0
      @activateAndScrollToComponent("#rc-"+(idx-1))

    else if (idx == 0) && (@components.length > 1)
      @activateAndScrollToComponent("#rc-1")

  removeComponentConfirmation: (component) =>
    if @components.length > 1
      @SweetAlert.confirm({
        title: "Are you sure you want to remove this component?"
        showLoaderOnConfirm: true
        focusCancel: true
        preConfirm: =>
          @removeComponent(component)
      })
    else
      @toaster.pop 'error', '', 'This page cannot be empty', 2000


  activateAndScrollToComponent: (element) ->
    $(element).trigger("click")
    $('html, body').animate({
      scrollTop: $(element).offset().top - 260
    }, 1000)

  setStyleClasses: (component) ->
    styleClasses = []
    styleClasses.push @setWidthClass(component.options.layout)
    styleClasses.push @setHeaderRowClass(component.type)

    styleClasses

  setHeaderRowClass: (type) ->
    headerRowClass = ''

    if type == 'header_row'
      headerRowClass = 'header-row'

    headerRowClass

  setWidthClass: (layout) ->
    widthClass = ''

    switch layout
      when '33'
        widthClass = 'col-xs-4'
      when '50'
        widthClass = 'col-xs-6'
      when '66'
        widthClass = 'col-xs-8'
      when '100'
        widthClass = 'col-xs-12'
      else
        widthClass = 'col-xs-12'

    widthClass
