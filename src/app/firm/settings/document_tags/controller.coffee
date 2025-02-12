class FirmSettingsDocumentTagsController extends BaseController
  @register 'FirmSettingsDocumentTagsController'

  @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex','angularEnabled'

  initialize: ->

    @is_admin = @Utils.isAdmin()
    @new_tag_params = {}
    @addCustomTagsUrl = 'firm/add-tags.html'
    @isPopoverOpen = false
    @tags_pattern = @$avoidFirstSplCharRegex

    @loadTags()

  loadTags: () ->
    @loading_tags = true

    @Restangular.all('document_tag_definitions').getList().then (response) =>
      @tags = response

      @groupTags()

      @loading_tags = false

  groupTags: () =>
    @tags = _(@tags).sortBy((tag) =>
      tag.name.toLowerCase()
    )

    @system_tags = []
    @custom_tags = []
    _(@tags).each (tag, i) =>
      if tag.firm_id
        @custom_tags.push(tag)
      else
        @system_tags.push(tag)

  displayTagRemovalConfirmation: (tag) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{tag.name}\"? Existing assignments will be deleted."
      type: 'warning'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeTag(tag) if isConfirm.value and isConfirm.value == true

  removeTag: (tag)->
    @Restangular.one('document_tag_definitions', tag.id).remove().then =>
      @toaster.pop 'success', 'Tag deleted successfully!'

      @tags.splice @tags.indexOf(tag), 1
      @groupTags()

  initiateTagAddition: ->
    @new_tag_params.list = []
    @isPopoverOpen = true

  saveTags: ->
    tags = @new_tag_params.list

    if @add_tags_form.$valid and tags.length
      promises = _(tags).map((tag) =>

        tag_exists = _.some @tags, (tag_item) ->
          tag_item.name.toLowerCase() == tag.text.toLowerCase()

        if !tag_exists
          promise = @Restangular.all('document_tag_definitions').post(
            name: tag.text
          )

          promise.then((response) =>
            @tags.push(response)
            @groupTags()
          )

          promise
        else
          @toaster.pop 'info', "Tag #{tag.text} already exists!"
          return null
      )

      @saving_tags = true

      @$q.all(promises).then =>
        @saving_tags = false
        @isPopoverOpen = false
        everythingButTheNulls = _.compact(promises)
        if everythingButTheNulls.length
          @toaster.pop 'success', 'Tags successfully added!'
