class PendingDraftRequestsController extends BaseController
    @register 'PendingDraftRequestsController'

    @inject 'RequestsResource', 'Restangular', '$http', '$timeout', 'ModalFactory', 'Utils', '$state', 'CommonService', 'FILTER_TERNARY_OPERATORS', 'keywordConstants'

    initialize: ->
        @requestsList = []
        @currentUserId = @Utils.getCurrentUser().id
        @loading_data = true
        @requestsList = @RequestsResource.$new(
            {
                options: {}
            }
        )
        @$timeout =>
            @loading_data = false

        @legends = [
          {
            label_type: 'warning'
            status: 'Pending approval'
            desc: 'Request pending approval by the approver.'
          }
          {
            label_type: 'danger'
            status: 'Rejected'
            desc: 'Request rejected by approver'
          }
          {
            label_type: 'info'
            status: 'Waiting for approval'
            desc: ' Request waiting for approval by the approver.'
          }
        ]

    openRow: (row,col)=>
        @onSelectedRow({"response": {"row" : row, "col" : col}})

    getRequestStatus:(status,user,approverIds) =>
        if approverIds.indexOf(@currentUserId) != -1 && status == 'InProgress' 
            return 'Pending approval'
        else if @currentUserId == user && status == 'InProgress'
            return 'Waiting for approval'
        else if status == 'Rejected' 
            return 'Rejected'

