class DiscussionDetailController extends BaseController

  @register 'DiscussionDetailController'

  @inject 'Restangular', '$stateParams', '$state', 'Restangular', 'toaster', 'currentUser', '$timeout', 'ModalFactory',
          '$tinymceToolbar1' , '$tinymceToolbar2', '$tinymcePlugins','$tinymceStatusbar'

  initialize: ->
    @discussionId = @$stateParams.discussionId
    @replies = []
    @current_page = 0
    @hide_answer_form = @$stateParams.action isnt 'write_answer'
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar1: @$tinymceToolbar1
      toolbar2: @$tinymceToolbar2
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

    @filters = {}

    @Restangular.one('discussions', @discussionId).get().then (response) =>
      @discussion = response

    @Restangular.all('discussions').customGET('', {
      pageNumber: 1,
      recordsPerPage: 3,
      sort: 'Popular'
    }).then (response) => @top_discussions = response.results

    @Restangular.all('discussions').customGET('', {
      pageNumber: 1,
      recordsPerPage: 3,
      sort: 'Recent'
    }).then (response) => @recent_discussions = response.results

  revealAnswerForm: ->
    @hide_answer_form = false
    @new_reply =
      discussionID: @discussionId
      author:
        anonymous: false

  loadReplies: ->
    if @is_loading_replies || @current_page is @total_pages
      return

    @current_page += 1
    @is_loading_replies = true

    @Restangular.all('discussion_replies').customGET('', {
      pageNumber: @current_page,
      discussionID: @discussionId
    }).then (response) =>
      _(response.results).each (reply) => @replies.push reply

      @total_pages = response.meta.totalPages
      @data_length = response.meta.totalRecords
      @data_loaded = true
      @is_loading_replies = false

  saveDiscussionReply: ->
    @saving_discussion_reply = true

    @Restangular.all('discussion_replies').post(@new_reply).then (response) =>
      message = 'Your answer has been posted!'

      @replies.push(response)
      @saving_discussion_reply = false
      @toaster.pop 'success', '', message, 5000
      @hide_answer_form = true

  performSearch: (filters) ->
    query_params = angular.extend({ sort: 'popular' }, filters)

    if _.isArray(query_params.category)
      query_params.category = _(query_params.category).pluck('text')

    @$state.go 'app.discuss.explore', query_params
