# class MFWController extends BaseController
#   @register 'MFWController'

#   @inject 'MFWResource', '$rootScope', 'Restangular', 'Utils', 'toaster','$state', 'LayoutUtils', '$window', 'ModalFactory'

#   initialize: ->
#     @legends = [
#       {
#         label_type: 'very-poor'
#         status: 'Very Poor'
#         desc: 'Funds having “significantly below average” prospects of outperformance after fees'
#       }
#       {
#         label_type: 'poor'
#         status: 'Poor'
#         desc: 'Funds having “below average” prospects of outperformance after fees'
#       }
#       {
#         label_type: 'average'
#         status: 'Average'
#         desc: 'Funds having “average” prospects of outperformance after fees'
#       }
#       {
#         label_type: 'good'
#         status: 'Good'
#         desc: 'Funds having “above average” prospects of outperformance after fees'
#       }
#       {
#         label_type: 'excellent'
#         status: 'Excellent'
#         desc: 'Funds having “significantly above average” prospects of outperformance after fees'
#       }
#     ]
#     @toggleRatingFeedbackPanel = @LayoutUtils.toggleRatingFeedbackPanel

#     @initGridSection = true
#     @mfwData = @MFWResource.$new({
#       options:{ provider: "mfw"},
#     })
#     @initGridSection = true

#   requestResearch:()->
#     @ModalFactory.invokeModal 'mfw_rating_feedback',

#   openRow: (row,col)=>
#     @toaster.pop 'success','','Download request received and is being processed'
#     params = 
#       provider: "mfw",
#       fund_id: row.entity.rating_service_fund_id
#     @Restangular.all('service/dvapi_service/rating_document').post(params).then (response) =>
#       @$window.open(response.url, '_blank');

#   getArrayForNumber: (number) =>
#     newArray = []
#     i = 0
#     while i<number
#       newArray.push i
#       i++
#     return newArray


