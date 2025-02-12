angular.module('diligenceVault').config (C3ChartFactoryProvider) ->
  C3ChartFactoryProvider
    .setPaddingRight(25)
    .setPaddingTop(15)
    .setColorPattern(['#264E86', '#20BF55', '#D14549', '#01BAEF', '#BAD75E', '#B576AD', '#757575', '#E6A71E'])
    .setDataEmptyLabelText('No data, no chart :)')
