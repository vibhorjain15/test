class CustomFieldValueController extends BaseController
  @register 'CustomFieldValueController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster','MentionsFactory', 'Utils'
  initialize: ->
    @templateUrl = ""
    @$scope.$watch 'field', (value) =>
      if value
        @field = value
        @loading_entities = false

    @loading_entities = true

    @fieldValue = @$scope.fieldValue
    # @templateName = @$scope.templateName


  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)
