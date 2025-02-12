tinyMCE.baseURL = '/assets/js'

app = angular.module 'diligenceVault'

app.config ($provide)=>
  $provide.decorator '$exceptionHandler', ($delegate,$window,Utils) =>
    (exception, cause) =>
      #continue only if _errs object is present
      if $window._errs?
        #get user information from utils
        current_user = Utils.getCurrentUser()

        #set the required user info in _errs along with the error details
        _errs.meta = _(current_user).pick('id', 'type', 'isAdmin','isReadOnly', 'firstName', 'lastName')
        _errs.meta.angularVersion = 'angularJs'
        _errs.push exception

      #call the delegate with error info for default error reporting(ie., log error to the console)
      $delegate exception, cause
      return

  $provide.decorator('$state', ($delegate, $transitions) =>
    #Add the toParams and toState in the $state object since we dont have this information available in the $state
    #if we dont add this the other way to get this is to add a $stateChangeStart listener, but because we had to add some
    #logic in the route.config we had to do this, since we cant add a event listener in the route config. This was a better
    #approach and will be helpful in the future.
    $transitions.onStart({}, (trans) =>
      $delegate.toParams = trans.params()
      $delegate.next = trans.to().name
      $delegate.previous = trans.from().name
    )
    return $delegate
  )


  $provide.decorator 'uiGridGroupingService', ($delegate) =>
    oriGroupColumn = $delegate.groupColumn
    $delegate.groupColumn = (grid, column) =>
      if grid.appScope.vm.clearGrouping
        grid.appScope.vm.clearGrouping(grid,column)
      oriGroupColumn.apply($delegate, arguments)

    oriUngroupColumn = $delegate.ungroupColumn
    $delegate.ungroupColumn = (grid, column) =>
      if grid.appScope.vm.clearSelection
        grid.appScope.vm.clearSelection(grid,column)
      oriUngroupColumn.apply($delegate, arguments)

    $delegate

class @BaseController
  @register: (name) ->
    app.controller name, @

  @inject: (args...) ->
    @$inject = args
    @$inject.push 'Utils'

  constructor: (args...) ->
    for key, index in @constructor.$inject
      @[key] = args[index]

    @beforeInit?()
    if !(@angularEnabled and @Utils.isAngular()) and !(@angularTemplateEnabled and @Utils.isTemplateAngular()) and !(@angularQuestionnaireEnabled and @Utils.isQuestionnaireAngular()) and !(@angularParserEnabled and @Utils.isParserAngular())
      @initialize?()


class @ModalController extends @BaseController
  @inject: (args...) ->
    unless _.contains(args, '$uibModalInstance')
      [].unshift.call arguments, '$uibModalInstance'

    [].unshift.call arguments, 'ChardinService'

    super

  beforeInit: ->
    @ChardinService.hide()

  close: (response) =>
    @$uibModalInstance.close response

  cancel: (response='cancel') =>
    @$uibModalInstance.dismiss response

Handsontable.renderers.registerRenderer 'percentageRenderer', (instance, td, row, col, prop, value, cellProperties) ->
  Handsontable.renderers.NumericRenderer.apply(@, arguments)

  if (!value? or value is '')
    return

  value = Number(value)
  $td = $(td)

  return if isNaN(value)

  if (value < 0)
    $td.removeClass('text-success').addClass('text-danger')
  else if (value > 0)
    $td.removeClass('text-danger').addClass('text-success')

  #using the '%' in format attribute will multiply by 100
  $(td).text("#{value.toFixed(2)} %")
