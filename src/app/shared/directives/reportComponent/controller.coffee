class ReportComponentController extends BaseController
  @register 'ReportComponentController'
  @inject '$scope', 'SweetAlert'

  activate: ->
    @active = true

  editComponent: ($event) ->
    $event.stopPropagation()
    @$scope.editComponent(@component)

  deactivate: ->
    @active = false

  setComponent: (component) ->
    @component = component

  getComponent: ->
    @component

  removeComponent: ($event) ->
    $event.stopPropagation()

    @$scope.removeComponent(@component)
