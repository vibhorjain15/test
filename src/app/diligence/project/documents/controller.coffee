class ProjectDocumentsController extends BaseController

  @register 'ProjectDocumentsController'

  @inject 'Utils', '$scope', '$state', 'Utils', 'ModalFactory', '$stateParams', 'DocumentDataservice', 'angularEnabled'

  initialize: ->
    @subscription = @Utils.getSubscriptionLevel()
    @isManager = @Utils.isManager()
    @isFreeInvestor = @Utils.isFreeInvestor()
    @isFreeManager = @Utils.isFreeManager()
    @$scope.ProjectDocumentsListController = {}
    @diligenceId = @$stateParams.diligenceId
    @current_user = @Utils.getCurrentUser()

    @getDocumentCounts(@diligenceId)

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
      if @current_user and @current_user.firmInfo
        permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
        if permissions_enabled
          @diligence.hasReadOnlyAccess = false
        else
          @diligence.isLocked = @diligence.isLocked || @diligence.hasReadOnlyAccess

  getDocumentCounts: (diligenceId) ->
    @DocumentDataservice.getAttachmentAssignmentCount('DueDiligence', diligenceId).then (response) =>
      @documentCount = response.count

  openUploadDocumentModal: ->
    entityId = @diligence.id
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          editAccessGranted: true
          entityType: 'DueDiligence'
          entityId: entityId
          mode: 'update'
          managerCheck: true
      success: (response) =>
        if response
          @$scope.ProjectDocumentsListController.documents.refresh()
          @getDocumentCounts(@diligenceId)