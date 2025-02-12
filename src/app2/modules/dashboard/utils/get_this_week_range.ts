import * as moment from 'moment';
export function getDueThisWeekRange() {
  const today = moment(new Date());

  const startDate = today.clone().startOf('day');
  const endDate = today.clone().add(6, 'days').endOf('day');
  return {
    start_due_date: startDate.format('YYYY-MM-DD HH:mm:ss'),
    end_due_date: endDate.format('YYYY-MM-DD HH:mm:ss'),
  };
}
export function getOverDueRange() {
  return {
    start_over_due_date:
      `${moment(new Date('1-1-2000')).format('YYYY-MM-DD')}` + ' 00:00:00',
    end_over_due_date:
      `${moment(new Date()).format('YYYY-MM-DD')}` + ' 23:59:59',
  };
}
