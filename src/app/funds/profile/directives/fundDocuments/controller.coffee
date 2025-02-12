class FundDocumentsController extends BaseController
  @register 'FundDocumentsController'
  @inject '$scope', '$attrs','Utils'

  initialize: ->
    @loadAttachments()
    @is_manager = @Utils.isManager()

  loadAttachments: ->
    deregisterer = @$scope.$parent.$watch @$attrs.attachments, (value) =>
      if value?
        @attachments = value
        deregisterer()
