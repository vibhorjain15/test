class UserProfileController extends BaseController

  @register 'UserProfileController'

  @inject '$stateParams', 'forumDataService', '$timeout'

  initialize: ->
    @$timeout (=>
      @user = @forumDataService.getUserByUsername(@$stateParams.username)
      @infinite_scroll_page_count = Math.ceil(@user.activities.length / 10)
      @current_page = 1
      @is_loading_activities = false
    ), 500

  loadNextPage: ->
    @is_loading_activities = true

    @$timeout (=>
      @current_page += 1
      @is_loading_activities = false
    ), 1000
