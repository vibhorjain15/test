class TeamActivityController extends BaseController

  @register 'TeamActivityController'

  @inject 'Restangular'

  initialize: ->
    @punchcard_options =
      tooltipText: (data) ->
        if not data.count
          str = 'No activity'
        else if data.count == 1
          str = 'One activity'
        else
          str = "#{data.count} activities"

        "#{str} on #{data.audit_date}"

    @Restangular.all('team_activities').customGET().then (response) =>
      punchcard_data = []

      _(response.teamMember).each((name, index) ->
        punchcard_row = [ { name: name } ]

        _(response.grouped_audits).each (audit_info) ->
          date = moment(audit_info.auditDate, 'MM-DD-YYYY')

          punchcard_row.push
            audit_date: date.format('DD MMM')
            count: audit_info.counts[index]

        punchcard_data.push punchcard_row
      )

      @punchcard_data = punchcard_data
