class FirmSettingsContactTagsController extends BaseController
    @register 'FirmSettingsContactTagsController'

    @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex', 'ModalFactory','angularEnabled'

    initialize: ->
        @contactInfo = {
            label: 'Contact Type Tags',
            name: 'Contact'
            templateUrl: 'firm/settings/popover_templates/Contact.html'
            desc: 'contact type, eg. Portfolio Management, Operations, Investment Relations'
        }
        @getContactTypes()

    getContactTypes: =>
        @Restangular.all('tags').getList(type: 'Contact').then (response) =>
            @contactTags = response
            @sortTags()

    sortTags: (type) =>
        @contactTags = _(@contactTags).sortBy((tag) =>
            tag.name.toLowerCase()
        )
