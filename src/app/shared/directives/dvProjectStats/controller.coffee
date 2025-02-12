class DvProjectStatsController extends BaseController
  @register 'DvProjectStatsController'

  @inject '$attrs', '$scope', 'Restangular', 'Utils'

  # This is a directive for diligence project stats
  # Pass diligence object attribute
  # Implementation: <dv-project-stats diligence="vm.diligence"></dv-project-stats>

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.diligence], (values) =>
      if values[0]
        @diligence = values[0]
        @entity_type = 'DueDiligence'
        @getProjectStats()
        @issue_tracker_default_name = @Utils.getIssueTrackerDefaultName()
        deregisterer()

  getProjectStats: ->
    @Restangular.all('followups').one('count', null).get(id: @diligence.id).then (response) =>
      @followups_count = response.count

    @Restangular.all('notes').one('count', null).get(entity_type: 'Duediligence', entity_id: @diligence.id).then (response) =>
      @notes_count = response.count

    @Restangular.all('todos').one('count', null).get(entity_id: @diligence.id).then (response) =>
      @todos_count = response

    @Restangular.all('attachmentassignments').one('count', null).get(
        entity_type: 'DueDiligence'
        entity_id: @diligence.id
      ).then (response) =>
        @attachments_count = response.count

    @Restangular.all('service/dvapi_service/get_issue_count').post(entity_id: @diligence.id, entity_type: 'Duediligence').then (response) =>
      @recommendation_counts = response
