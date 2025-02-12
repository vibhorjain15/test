class DDJobProgressbarController extends BaseController
  @register 'DDJobProgressbarController'

  @inject '$interval', '$scope', '$attrs', 'Restangular'

  initialize: ->
    @min_progress = 3
    @progress = @min_progress
    @job_id = @$scope.$parent.$eval @$attrs.jobId

    @interval_id = @$interval =>
      @refreshJobStatus()
    , 3 * 1000 # every 3 seconds

    @refreshJobStatus()

    @$scope.$on '$destroy', =>
      @clearInterval()

  clearInterval: ->
    @$interval.cancel @interval_id

  refreshJobStatus: ->
    @Restangular.one('jobs', @job_id).get().then (response) =>
      prev_progress = @progress
      @progress = response.percentage_completed || @min_progress

      if prev_progress isnt @progress && @$attrs.onChange?
        @$scope.$parent.$eval @$attrs.onChange,
          progress: @progress
          job: response

      @clearInterval() if @progress is 100
