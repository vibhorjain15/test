class FirmSettingsDocClassificationController extends BaseController
  @register 'FirmSettingsDocClassificationController'

  @inject 'Restangular', 'SweetAlert', 'toaster', 'BaseDataService', 'Utils', '$q', 'toaster', 'BaseDataService', '$state','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @isInvestor = @Utils.isInvestor()
    @getDetailsAndFormat()

  getDetailsAndFormat: () =>
    promises = []

    promises.push @Restangular.all('tags').getList(type: 'Attachments')
    promises.push @Restangular.all('document_type_groupings').getList()
    promises.push @BaseDataService.getAttachmentTypes()

    @$q.all(promises).then (responses) =>
      @document_groups = responses[0]
      @document_groups = _(@document_groups).sortBy((tag) =>
        tag.name.toLowerCase()
      )
      @document_types = responses[2]

      groupedTags = _(responses[1]).groupBy 'group_id'

      _(groupedTags).each (group, groupId) =>
        documentGroup = _(@document_groups).find (group) -> group.id == parseInt groupId
        group = _(group).sortBy((tag) =>
          tag.type_name.toLowerCase()
        )
        documentGroup.tags = group

  saveAssignment: () ->
    @saving_tags = true
    param =
      entity_type: 'DocumentGroup'
      entity_id: @group_id
      tags: @document_tags

    @Restangular.all('document_type_groupings').post(param).then((response) =>
      @used_tags = response
      @getDetailsAndFormat()
      @displaySidebarPanel = false
      @toaster.pop 'success', '', 'Document Tag updated successfully'
      , (error) =>
        @toaster.pop 'error', 'Unable to update Document Tag!'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Updating Document Tag Failed', error)
    ).finally(=>
      @saving_tags = false
    )

  getMatcher: (collection) ->
    ($query) ->
      return collection unless $query
      regex = new RegExp($query, 'i')
      _(collection).filter((item) -> regex.test item.label)

  displayAssignTagsController: (group) ->
    @sidebarTemplate = 'firm/settings/document_classifications/assign_tags/template.html'
    @sidebarTitle = group.name
    @displaySidebarPanel = true
    @group_id = group.id
    @document_tags = _(group.tags).map (tag) -> tag.type_id

  initiateDocGroupAddition: ->
    @$state.go 'app.firm.settings.document_group_tags'

