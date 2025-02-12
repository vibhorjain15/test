class TagsManagerController extends BaseController
    @register 'TagsManagerController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','ModalFactory','SweetAlert','toaster'

    initialize: ->
        @loading_tags = true
        @is_admin = @Utils.isAdmin()
        @new_tag_params = {}
        @isPopoverOpen = false
        @saving_tags = false
        @tags_pattern = @$avoidFirstSplCharRegex
        @templateUrl = 'firm/add-tags.html'

        @$scope.$watch 'vm.tagsValue',(value)=>
            if value
                @loading_tags = false

    sortTags: =>
        @tagsValue = _(@tagsValue).sortBy((tag) =>
            tag.name.toLowerCase()
        )

    displayTagRemovalConfirmation: (tag) ->
        @SweetAlert.confirm({
            title: "Are you sure you want to remove \"#{tag.name}\"? Existing assignments will be deleted."
            confirmButtonText: 'Yes'
            focusCancel: true
        }).then (isConfirm) =>
            @removeTag(tag) if isConfirm.value and isConfirm.value == true

    removeTag: (tag)->
        @Restangular.one('tags', tag.id).remove().then =>
            @toaster.pop 'success', 'Tag deleted successfully!'

            @tagsValue.splice @tagsValue.indexOf(tag), 1

    initiateTagAddition: ->
        @new_tag_params = {}
        @new_tag_params.list = []
        @isPopoverOpen = true

    saveTags: (tagLabel)->
        tags = @new_tag_params.list

        if @add_tags_form.$valid and tags.length
            promises = _(tags).map((tag) =>

                tag_exists = _.some @tagsValue[tagLabel], (tag_item) ->
                    tag_item.name.toLowerCase() == tag.text.toLowerCase()

                if !tag_exists
                    promise = @Restangular.all('tags').post(
                        name: tag.text,
                        type: @tag.name
                    )

                    promise.then(
                        (response) =>
                            @tagsValue.push(response)
                            @sortTags()
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
