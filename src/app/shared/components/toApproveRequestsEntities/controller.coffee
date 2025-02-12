class ToApproveRequestsEntitiesController extends BaseController

    @register 'ToApproveRequestsEntitiesController'

    @inject 'ToApproveRequestsEntitiesResource', 'DocumentsService', 'Restangular', '$http', '$timeout', 'ModalFactory', 'Utils', '$state', 'CommonService', 'FILTER_TERNARY_OPERATORS', 'keywordConstants'

    initialize: ->
        @requestsList = []
        @loading_data = true
        @requestsList = @ToApproveRequestsEntitiesResource.$new(
            {
                options: @toApproveRequestData,
                toApproveRequestData: @toApproveRequestData
            }
        )
        @$timeout =>
            @loading_data = false

    formatTagsTooltip: (tagsList) ->
        @DocumentsService.formatTagsTooltip(tagsList)