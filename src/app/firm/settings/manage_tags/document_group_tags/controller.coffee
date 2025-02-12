class FirmSettingsDocumentGroupTagsController extends BaseController
    @register 'FirmSettingsDocumentGroupTagsController'

    @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex', 'ModalFactory','angularEnabled'

    initialize: ->
        @contactInfo = {
            label: 'Document Groups',
            name: 'Attachments'
            desc: 'grouping of documents, eg. Compliance, Marketing, Investments, etc'
        }
        @getDocumentTypes()

    getDocumentTypes: =>
        @Restangular.all('tags').getList(type: 'Attachments').then (response) =>
            @documentTags = response
            @sortTags()

    sortTags: (type) =>
        @documentTags = _(@documentTags).sortBy((tag) =>
            tag.name.toLowerCase()
        )
