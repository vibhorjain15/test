angular.module('diligenceVault').factory 'dataservice', ($state) ->

  new class Dataservice
    getActionButtonHTML = (title, icon_class) ->
      '<button type="button" class="btn btn-xs btn-default" title="' + title + '">' + '<i  href= "app/due_diligence/invite" class="dvi dvi-' + icon_class + '"></i>' + '</button>'

    buttonFormatter = ->
      getActionButtonHTML 'Start new diligence', 'search'

    nameFormatter: (row, cell, value, columnDef, dataContext) ->
      "<a href='#{$state.href('app.funds.profile', fundId: dataContext.id)}'>#{value}</a>"

    newFundFormatter: (row, cell, value) ->
      if value then '<i class="dvi dvi-fire" title="Popular fund"></i>' else ''

    getSearchData: (structure) ->
      dataset = [
        {
          'name': 'IFCI Sycamore India Infrastructure Fund'
          'category': 'Fund Raising'
          'strategy': 'Infrastructure'
          'sub_strategy': ''
          'date_of_registration': '23-Jul-12'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 120
          'percentage_complete': 80
          'is_new': true
          'id': 1
          'structure': 'PE'
        }
        {
          'name': 'Utthishta Yekum Fund'
          'category': 'Fund Raising'
          'strategy': 'Venture'
          'sub_strategy': ''
          'date_of_registration': '1-Aug-12'
          'city': 'Hyderabad'
          'state': 'Telangana'
          'aum': 45
          'percentage_complete': 75
          'id': 2
          'structure': 'PE'
        }
        {
          'name': 'Indiaquotient Investment Trust'
          'category': 'Liquidating'
          'strategy': 'Growth'
          'sub_strategy': ''
          'date_of_registration': '13-Aug-12'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 15
          'percentage_complete': 60
          'id': 3
          'structure': 'PE'
        }
        {
          'name': 'Forefront Alternative Investment Trust'
          'category': 'Fund Raising'
          'strategy': 'Multi-strategy'
          'sub_strategy': ''
          'date_of_registration': '14-Aug-12'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 25
          'percentage_complete': 90
          'id': 4
          'structure': 'HF'
        }
        {
          'name': 'Excedo Realty Fund — I'
          'category': 'Closed'
          'strategy': 'Real Estate'
          'sub_strategy': ''
          'date_of_registration': '14-Aug-12'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 5
          'percentage_complete': 55
          'id': 5
          'structure': 'PE'
        }
        {
          'name': 'Real Estate Opportunities Trust'
          'category': 'Closed'
          'strategy': 'Real Estate'
          'sub_strategy': ''
          'date_of_registration': '20-Sep-12'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 96
          'percentage_complete': 100
          'id': 6
          'structure': 'PE'
        }
        {
          'name': 'KKR India Alternative Credit  Opportunities Fund I'
          'category': 'Fund Raising'
          'strategy': 'Relave Value Credit'
          'sub_strategy': ''
          'date_of_registration': '14-Aug-12'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 240
          'percentage_complete': 68
          'id': 7
          'structure': 'HF'
        }
        {
          'name': 'Quant First Alternate Investment  Trust'
          'category': 'Fund Raising'
          'strategy': 'Statistical Arbitrage'
          'sub_strategy': ''
          'date_of_registration': '11/26/12'
          'city': 'Bangalore'
          'state': 'Karnataka'
          'aum': 15
          'percentage_complete': 89
          'is_new': true
          'id': 8
          'structure': 'HF'
        }
        {
          'name': 'Fulcrum Venture India Trust'
          'category': 'Fund Raising'
          'strategy': 'Equity L/S'
          'sub_strategy': ''
          'date_of_registration': '11/26/12'
          'city': 'Chennai'
          'state': 'Tamil Nadu'
          'aum': 3
          'percentage_complete': 95
          'id': 9
          'structure': 'HF'
        }
        {
          'name': 'Manufacturing Value Addition Fund'
          'category': 'Liquidating'
          'strategy': 'Sector Focus'
          'sub_strategy': ''
          'date_of_registration': '12/13/12'
          'city': 'Kolkata'
          'state': 'West Bengal'
          'aum': 45
          'percentage_complete': 17
          'id': 10
          'structure': 'LO'
        }
        {
          'name': 'Incube Connect Fund'
          'category': 'Closed'
          'strategy': 'Venture'
          'sub_strategy': 'Social Venture'
          'date_of_registration': '1/23/13'
          'city': 'Ahemdabad'
          'state': 'Gujarat'
          'aum': 23
          'percentage_complete': 87
          'id': 11
          'structure': 'PE'
        }
        {
          'name': 'Cheraman Fund'
          'category': 'Fund Raising'
          'strategy': 'Sector Focus'
          'sub_strategy': ''
          'date_of_registration': '2/28/13'
          'city': 'Ponnurunni'
          'state': 'Kerala'
          'aum': 10
          'percentage_complete': 0
          'id': 12
          'structure': 'LO'
        }
        {
          'name': 'Lotuspool Fund‐ I '
          'category': 'Fund Raising'
          'strategy': 'Growth'
          'sub_strategy': ''
          'date_of_registration': '3/28/13'
          'city': 'Bangalore'
          'state': 'Karnataka'
          'aum': 11
          'percentage_complete': 67
          'id': 13
          'structure': 'PE'
        }
        {
          'name': 'Black Olive Real Estate Opportunities  Trust'
          'category': 'Closed'
          'strategy': 'Real Estate'
          'sub_strategy': ''
          'date_of_registration': '4/2/13'
          'city': 'Noida'
          'state': 'Uttar Pradesh'
          'aum': 123
          'percentage_complete': 98
          'is_new': true
          'id': 14
          'structure': 'PE'
        }
        {
          'name': 'Startup Village Fund'
          'category': 'Closed'
          'strategy': 'Venture'
          'sub_strategy': ''
          'date_of_registration': '4/23/13'
          'city': 'Cochin'
          'state': 'Kerala'
          'aum': 45
          'percentage_complete': 88
          'id': 15
          'structure': 'PE'
        }
        {
          'name': 'Ireo Advantage Fund '
          'category': 'Closed'
          'strategy': 'Small Cap'
          'sub_strategy': ''
          'date_of_registration': '5/3/13'
          'city': 'Gurgaon'
          'state': 'Haryana'
          'aum': 55
          'percentage_complete': 80
          'id': 16
          'structure': 'LO'
        }
        {
          'name': 'Monsoon Alternative Investment  Trust'
          'category': 'Closed'
          'strategy': 'Discretionary Macro'
          'sub_strategy': ''
          'date_of_registration': '5/6/13'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 10
          'percentage_complete': 45
          'id': 17
          'structure': 'HF'
        }
        {
          'name': 'Rudrabhishek Infrastructure Trust'
          'category': 'Closed'
          'strategy': 'Infrastructure'
          'sub_strategy': ''
          'date_of_registration': '5/15/13'
          'city': 'New Delhi'
          'state': 'Delhi'
          'aum': 450
          'percentage_complete': 90
          'id': 18
          'structure': 'PE'
        }
        {
          'name': 'Arth Capital Fund'
          'category': 'Fund Raising'
          'strategy': 'Large Cap'
          'sub_strategy': ''
          'date_of_registration': '8/14/13'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 210
          'percentage_complete': 87
          'is_new': true
          'id': 19
          'structure': 'LO'
        }
        {
          'name': 'Ankur Capital Fund'
          'category': 'Fund Raising'
          'strategy': 'Small Cap'
          'sub_strategy': 'Angel Investing'
          'date_of_registration': '3/13/14'
          'city': 'Mumbai'
          'state': 'Maharashtra'
          'aum': 10
          'percentage_complete': 10
          'id': 20
          'structure': 'LO'
        }
      ]

      _.where dataset, structure: structure

    getGridColumns: (structure) ->
      [
        {
          id: 'is_new'
          name: ' '
          field: 'is_new'
          width: 20
          resizable: false
          cssClass: 'text-center'
          formatter: _.bind(@newFundFormatter, @)
        }
        {
          id: 'name'
          name: 'Name of the Alternative Investment Fund'
          field: 'name'
          minWidth: 350
          sortable: true
          formatter: _.bind(@nameFormatter, @)
        }
        {
          id: 'strategy'
          name: 'Strategy'
          field: 'strategy'
          minWidth: 120
          sortable: true
        }
        {
          id: 'aum'
          name: 'AUM (Rs. Cr)'
          field: 'aum'
          minWidth: 120
          sortable: true
        }
        {
          id: 'city'
          name: 'City'
          field: 'city'
          width: 150
          sortable: true
        }
        {
          id: 'percentage_complete'
          name: '% Complete'
          field: 'percentage_complete'
          minWidth: 120
          resizable: false
          formatter: Slick.Formatters.PercentCompleteBar
          sortable: true
        }
        {
          id: 'action_buttons'
          name: 'Actions'
          field: 'action_buttons'
          width: 100
          cssClass: 'text-center'
          formatter: buttonFormatter
        }
      ]

    getCities: ->
      [
        'Mumbai'
        'Hyderabad'
        'Bangalore'
        'Chennai'
        'Kolkata'
        'Ahmedabad'
        'Ponnurunni'
        'Noida'
        'Cochin'
        'Gurgaon'
        'New Delhi'
      ]

    getProfileData: (fund_id) ->
      profile_list = [
        {
          'id': 1
          'category': 'Fund Raising'
          'fund_aum': 120
          'inception_date': '1-Aug-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 240
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'IFCI Sycamore India Infrastructure Fund'
          'strategy': 'Infrastructure'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 10
          'category': 'Liquidating'
          'fund_aum': 45
          'inception_date': '1-Jan-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 90
          'fund_count': 3
          'employee_count': 15
          'investor_count': 25
          'firm_ownership': '100%'
          'name': 'Manufacturing Value Addition Fund'
          'strategy': 'Sector Focus'
          'performance_fee': 0
          'management_fee': 1
          'carry_fee': null
          'structure': 'LO'
        }
        {
          'id': 11
          'category': 'Closed'
          'fund_aum': 23
          'inception_date': '1-Feb-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 46
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Incube Connect Fund'
          'strategy': 'Venture'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 13
          'category': 'Fund Raising'
          'fund_aum': 11
          'inception_date': '1-Apr-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 22
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Lotuspool Fund‐ I '
          'strategy': 'Growth'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 15
          'category': 'Closed'
          'fund_aum': 45
          'inception_date': '1-May-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 90
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Startup Village Fund'
          'strategy': 'Venture'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 18
          'category': 'Closed'
          'fund_aum': 450
          'inception_date': '1-Jun-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 900
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Rudrabhishek Infrastructure Trust'
          'strategy': 'Infrastructure'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 19
          'category': 'Fund Raising'
          'fund_aum': 210
          'inception_date': '1-Sep-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 420
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Arth Capital Fund'
          'strategy': 'Large Cap'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 0
          'structure': 'LO'
        }
        {
          'id': 20
          'category': 'Fund Raising'
          'fund_aum': 10
          'inception_date': '1-Apr-14'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 20
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Ankur Capital Fund'
          'strategy': 'Small Cap'
          'performance_fee': null
          'management_fee': 1.5
          'carry_fee': null
          'structure': 'LO'
        }
        {
          'id': 2
          'category': 'Fund Raising'
          'fund_aum': 45
          'inception_date': '1-Sep-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 90
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Utthishta Yekum Fund'
          'strategy': 'Venture'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 3
          'category': 'Liquidating'
          'fund_aum': 15
          'inception_date': '1-Sep-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 30
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Indiaquotient Investment Trust'
          'strategy': 'Growth'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 5
          'category': 'Closed'
          'fund_aum': 5
          'inception_date': '1-Sep-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 10
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Excedo Realty Fund — I'
          'strategy': 'Real Estate'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 6
          'category': 'Closed'
          'fund_aum': 96
          'inception_date': '1-Oct-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 192
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Real Estate Opportunities Trust'
          'strategy': 'Real Estate'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 7
          'category': 'Fund Raising'
          'fund_aum': 240
          'inception_date': '1-Sep-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 480
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'KKR India Alternative Credit  Opportunities Fund I'
          'strategy': 'Relative Value Credit'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'HF'
        }
        {
          'id': 9
          'category': 'Fund Raising'
          'fund_aum': 3
          'inception_date': '1-Dec-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 6
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Fulcrum Healthcare India Trust'
          'strategy': 'Equity L/S'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'HF'
        }
        {
          'id': 12
          'category': 'Fund Raising'
          'fund_aum': 10
          'inception_date': '1-Mar-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 20
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Cheraman Fund'
          'strategy': 'Sector Focus'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': null
          'structure': 'LO'
        }
        {
          'id': 14
          'category': 'Closed'
          'fund_aum': 123
          'inception_date': '1-May-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 246
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Black Olive Real Estate Opportunities  Trust'
          'strategy': 'Real Estate'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'
        }
        {
          'id': 16
          'category': 'Closed'
          'fund_aum': 55
          'inception_date': '1-Jun-13'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 110
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Ireo Advantage Fund '
          'strategy': 'Small Cap'
          'performance_fee': 0
          'management_fee': 1.25
          'carry_fee': null
          'structure': 'LO'
        }
        {
          'id': 4
          'category': 'Fund Raising'
          'fund_aum': 25
          'inception_date': '1-Sep-12'
          'hwm': 'Yes'
          'cio': 'Nita Kumar'
          'firm_aum': 120
          'fund_count': 4
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Forefront Alternative Investment Trust'
          'strategy': 'Multi-strategy'
          'performance_fee': 20
          'management_fee': 2
          'carry_fee': null
          'structure': 'HF'
        }
        {
          'id': 8
          'category': 'Fund Raising'
          'fund_aum': 15
          'inception_date': '1-Dec-12'
          'hwm': 'Yes'
          'cio': 'Raj Kumar'
          'firm_aum': 30
          'fund_count': 3
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Quant First Alternate Investment  Trust'
          'strategy': 'Statistical Arbitrage'
          'performance_fee': 20
          'management_fee': 2
          'carry_fee': null
          'structure': 'HF'
        }
        {
          'id': 17
          'category': 'Closed'
          'fund_aum': 10
          'inception_date': '1-Jun-13'
          'hwm': 'Yes'
          'cio': 'Nita Kumar'
          'firm_aum': 120
          'fund_count': 4
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'Monsoon Alternative Investment  Trust'
          'strategy': 'Discretionary Macro'
          'performance_fee': 20
          'management_fee': 2
          'carry_fee': null
          'structure': 'HF'
        }
      ]

      _(profile_list).findWhere({id: Number(fund_id)})

    getProfileTableData: ->
      [
        {
          'fund_name': 'Maiden Fund'
          'size': 80
          'vintage': 2006
          'percentage_invested': '100%'
          'deal_count': 12
          'exit_count': '98%'
          'avg_exit': '5x'
          'portfolio_manager': 'Sreenivasan'
        }
        {
          'fund_name': 'Fund I'
          'size': 120
          'vintage': 2011
          'percentage_invested': '90%'
          'deal_count': 19
          'exit_count': '20%'
          'avg_exit': '1.5x'
          'portfolio_manager': 'Raj Kumar'
        }
      ]

    getProfileTableColumnModel: ->
      [
        {
          id: 'fund_name'
          name: 'Fund Name'
          field: 'fund_name'
          width: 200
          sortable: true
        }
        {
          id: 'size'
          name: 'Size (Rs. Cr)'
          field: 'size'
          width: 120
          sortable: true
        }
        {
          id: 'vintage'
          name: 'Vintage'
          field: 'vintage'
          width: 100
          sortable: true
        }
        {
          id: 'percentage_invested'
          name: '% Invested'
          field: 'percentage_invested'
          minWidth: 120
          resizable: false
          formatter: Slick.Formatters.PercentCompleteBar
          sortable: true
        }
        {
          id: 'deal_count'
          name: '# of Deals'
          field: 'deal_count'
          width: 100
          sortable: true
        }
        {
          id: 'exit_count'
          name: '% of Exits'
          field: 'exit_count'
          minWidth: 120
          resizable: false
          formatter: Slick.Formatters.PercentCompleteBar
          sortable: true
        }
        {
          id: 'avg_exit'
          name: 'Avg Exit Mult'
          field: 'avg_exit'
          width: 100
          sortable: false
        }
        {
          id: 'portfolio_manager'
          name: 'Portfolio Manager'
          field: 'portfolio_manager'
          width: 150
          sortable: true
        }
      ]


