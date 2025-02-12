class DDByResponsesController extends BaseController
  @register 'DDByResponsesController'
  @inject '$dvSidebarInstance', 'aggregate', 'questionId', 'templateId', 'tagId',
          'DDByResponseResource','customDateFilter'

  initialize: ->
    params =
      question_id: @questionId
      template_id: @templateId
      tag_id: @tagId
      start_date: @customDateFilter.start_date
      end_date: @customDateFilter.end_date

    angular.extend params, @aggregate.responseMeta

    @diligences = @DDByResponseResource.$new(params)
