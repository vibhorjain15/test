class FirmSettingsAllTagsController extends BaseController
  @register 'FirmSettingsAllTagsController'

  @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex','angularEnabled'

  initialize: ->
    tag_type = @$stateParams.type
    @is_investor = @Utils.isInvestor()
    @userType = if @is_investor then 'investor' else 'manager'
    @tagsList = [
      {
        label: 'Asset Allocation',
        name: 'AssetAllocation'
        desc: 'your asset allocation buckets, eg, Core fixed income, Global equities, Liability hedging'
        hidden_from: 'manager'
      }
      {
        label: 'Conviction Level',
        name: 'Conviction'
        desc: 'your conviction level, eg. High, Low'
        hidden_from: 'manager'
      }
      {
        label: 'Geographic Focus',
        name: 'Geography'
        desc: 'manager geographic focus, eg. Western Europe, Africa'
        hidden_from: 'manager'
      }
      {
        label: 'Investment Thesis',
        name: 'InvestmentThesis'
        desc: 'your investment thesis, eg. EM growth, USD strength'
        hidden_from: 'manager'
      }
      {
        label: 'Watch List',
        name: 'WatchList'
        desc: 'your watchlist criteria, eg. Quant, Qual, Keyman'
        hidden_from: 'manager'
      }
      {
        label: 'Relationship Status',
        name: 'Status'
        desc: 'your manager, fund status, eg. Prospective, Current, Terminated'
      }
      {
        label: 'Question Category',
        name: 'Question'
        desc: 'questions categories, eg. Legal, Investments, Firm-level'
        hidden_from: 'investor'
      },
      {
        label: "#{@Utils.getIssueTrackerDefaultName() ? 'Recommendation'} Tracker",
        name: 'Issue',
        desc: '',
      },
    ]

    @tags = {}
    @is_admin = @Utils.isAdmin()

    @getTags()

  getTags: =>
    _(@tagsList).each (tag)=>
      @loadTags(tag.name)

  loadTags: (type) ->
    @Restangular.all('tags').getList(type: type).then (response) =>
      @tags[type] = response
      @sortTags(type)

  sortTags: (type) =>
    @tags[type] = _(@tags[type]).sortBy((tag) =>
      tag.name.toLowerCase()
    )
