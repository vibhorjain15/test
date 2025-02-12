class ProjectStatusLegendController extends BaseController

  @register 'ProjectStatusLegendController'

  @inject '$stateParams','Utils'

  initialize: ->
    type = @$stateParams.type
    @is_investor = @Utils.isInvestor()
    @invitedText = if @is_investor then 'New Request' else 'New investor request'

    if @is_investor

      switch type
        when 'in-progress'
          @legends = [
              {
                label_type: 'warning'
                status: 'Invited'
                desc: @invitedText
              }
              {
                label_type: 'default'
                status: 'Started'
                desc: 'Response being populated'
              }
              {
                label_type: 'success'
                status: 'Completed'
                desc: 'Response submitted'
              }
              {
                label_type: 'warning'
                status: 'Pending Restart'
                desc: 'Pending Restart'
              }
              {
                label_type: 'warning'
                status: 'Followup'
                desc: 'Q/A between Investor & Manager'
              }
              {
                label_type: 'warning'
                status: 'Extension Requested'
                desc: 'Extension for due date requested'
              }
              {
                label_type: 'info'
                status: 'In Review'
                desc: 'Review before completing a project'
              }
              {
                label_type: 'info'
                status: 'Evaluation'
                desc: 'Review after completing a project'
              }
            ]
        when 'my projects', 'all'
          @legends = [
            {
              label_type: 'warning'
              status: 'Invited'
              desc: @invitedText
            }
            {
              label_type: 'default'
              status: 'Started'
              desc: 'Response being populated'
            }
            {
              label_type: 'success'
              status: 'Completed'
              desc: 'Response submitted'
            }
            {
              label_type: 'warning'
              status: 'Pending Restart'
              desc: 'Pending Restart'
            }
            {
              label_type: 'warning'
              status: 'Followup'
              desc: 'Q/A between Investor & Manager'
            }
            {
              label_type: 'warning'
              status: 'Extension Requested'
              desc: 'Extension for due date requested'
            }
            {
              label_type: 'info'
              status: 'In Review'
              desc: 'Review before completing a project'
            }
            {
              label_type: 'info'
              status: 'Evaluation'
              desc: 'Review after completing a project'
            }
            {
              label_type: 'orange'
              status: 'Sent'
              desc: 'New Request sent but not started'
            }
            {
              label_type: 'danger'
              status: 'Deleted'
              desc: 'Requests Deleted'
            }
            {
              label_type: 'danger'
              status: 'Withdrawn'
              desc: 'Requests Withdrawn'
            }
          ]
        when 'closed'
          @legends = [
            {
              label_type: 'success'
              status: 'Approved'
              desc: 'Closed and request accepted'
            }
            {
              label_type: 'danger'
              status: 'Not Approved'
              desc: 'Closed and request not accepted'
            }
          ]
    else
      switch type
        when 'in-progress'
          @legends = [
              {
                label_type: 'warning'
                status: 'Invited'
                desc: @invitedText
              }
              {
                label_type: 'default'
                status: 'Started'
                desc: 'Response being populated'
              }
              {
                label_type: 'success'
                status: 'Completed'
                desc: 'Response submitted'
              }
              {
                label_type: 'warning'
                status: 'Pending Restart'
                desc: 'Pending Restart'
              }
              {
                label_type: 'warning'
                status: 'Followup'
                desc: 'Q/A between Investor & Manager'
              }
              {
                label_type: 'warning'
                status: 'Extension Requested'
                desc: 'Extension for due date requested'
              }
              {
                label_type: 'info'
                status: 'In Review'
                desc: 'Review before completing a project'
              }
              {
                label_type: 'info'
                status: 'Evaluation'
                desc: 'Review after completing a project'
              }
            ]
        when 'my projects', 'all'
          @legends = [
            {
              label_type: 'warning'
              status: 'Invited'
              desc: @invitedText
            }
            {
              label_type: 'default'
              status: 'Started'
              desc: 'Response being populated'
            }
            {
              label_type: 'success'
              status: 'Completed'
              desc: 'Response submitted'
            }
            {
              label_type: 'warning'
              status: 'Pending Restart'
              desc: 'Pending Restart'
            }
            {
              label_type: 'warning'
              status: 'Followup'
              desc: 'Q/A between Investor & Manager'
            }
            {
              label_type: 'warning'
              status: 'Extension Requested'
              desc: 'Extension for due date requested'
            }
            {
              label_type: 'info'
              status: 'In Review'
              desc: 'Review before completing a project'
            }
            {
              label_type: 'info'
              status: 'Evaluation'
              desc: 'Review after completing a project'
            }
            {
              label_type: 'orange'
              status: 'Sent'
              desc: 'New Request sent but not started'
            }
            {
              label_type: 'danger'
              status: 'Deleted'
              desc: 'Requests Deleted'
            }
            {
              label_type: 'danger'
              status: 'Withdrawn'
              desc: 'Requests Withdrawn'
            }
          ]
        when 'closed'
          @legends = [
            {
              label_type: 'success'
              status: 'Approved'
              desc: 'Closed and request accepted'
            }
            {
              label_type: 'danger'
              status: 'Not Approved'
              desc: 'Closed and request not accepted'
            }
            {
              label_type: 'success'
              status: 'Completed'
              desc: 'Response submitted'
            }
          ]

