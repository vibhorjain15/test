angular.module('diligenceVault').directive 'fundReturn', ->
  restrict: 'E'
  template: '<div class="label"></div>'
  replace: true
  link: (scope, element, attrs) ->
    init = (fund_return, date) ->
      formatted_date = date.format("MMM YYYY").toUpperCase()

      unless fund_return?
        return_class = 'label-default'
      else if fund_return > 0
        return_class = 'label-success'
      else if fund_return < 0
        return_class = 'label-danger'
      else if fund_return is 0
        return_class = 'label-info'

      element.addClass(return_class)

      if fund_return?
        fund_return = "#{fund_return.toFixed(2)}%"
        $date_html = $('<span></span>').text(formatted_date)
        $return_html = $('<strong></strong>').text(fund_return)

        element
          .append($date_html)
          .append('<span> : </span>')
          .append($return_html)
      else
        element.append('Not Available')

    deregisterer = scope.$watchGroup [attrs.fundReturn, attrs.date], (values) ->
      [fund_return, date] = values

      if date? #return can be null, hence not doing score?
        date = moment(date)

        init(fund_return, date)
        deregisterer()
