class ProjectCommentsController extends BaseController

  @register 'ProjectCommentsController'

  @inject '$scope', 'toaster', 'Restangular', 'BaseDataService', 'Utils','responseStatus','dvThresholds'

  initialize: ->
    @isInvestor = @Utils.isInvestor()
    @response = @$scope.response
    @current_user = @Utils.getCurrentUser()
    @placeholderText = if !@isInvestor then "Supplement your response with a comment that is viewable by your investors. i.e. If you mark a question as N/A, you can explain why it is N/A in a comment." else ""
    if @response.attributes.textResponse
      @newComment =
        text: @response.attributes.textResponse

    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditEditor = editor
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      plugins: 'autoresize'
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""
      placeholder: @placeholderText

  updateComment: ->
    @$scope.updateComment(@newComment.text)

  deleteComment:() ->
    @$scope.deleteComment()

  closeCommentBox: ->
    @$scope.closeComment()

  showEditMode: ->
    #if it is in precompletion review then show the comment based on the response status. but if it is not in precompletion 
    #review then use the earlier condition to show this.
    isReadonlyEditable = @response.scope.isReadonlyEditable
    showEditForReview = (@response.attributes.response_status == @responseStatus.STARTED or @response.verifierEdit or ((!@$scope.questionnaireController.firm_preferences.enable_track_changes or @response.responseType in ['ReturnTable', 'aumTable', 'Attachment'] or !@response.responses_history) and (@response.attributes.response_status == @responseStatus.REVIEWFAILED and @response.verifier and @response.verifier.attributes.assigned_to != @current_user.id  and (typeof @response.timeDiff == 'number' && @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT))))
    return (!isReadonlyEditable and !(@isInvestor and !@$scope.isInternal) and @$scope.isEditable and !@$scope.printPreview) or (isReadonlyEditable and showEditForReview) 