import * as moment from 'moment';

export enum MyProjectTypeFilterEnum {
  All = 'All',
  EXTERNAL = 'External',
  INTERNAL = 'Internal',
  OPPORTUNITY_VAULt = 'Opportunity Vault',
  ANALYST_EVALUTION = 'Analyst Evaluation',
}

export enum MyProjectFilterEnum {
  ALL_ACTIVE = 'My Active Projects',
  MY_SENT = 'My Sent Projects',
  MY_CLOSED = 'My Closed Projects',
}

export const subEntityMapper = (recommendationName) => ({
  'projects-pending': {
    title: 'No Projects are Pending',
    description:
      'All done! Nothing is pending for you for the selected date range.',
  },
  'projects-duethisweek': {
    title: 'No Due Projects This Week!',
    description: 'All done! Nothing is pending for you for this week.',
  },
  'projects-overdue': {
    title: 'No Projects are Overdue',
    description:
      'Nice job staying on track! Review all projects to ensure everything is on time.',
  },
  'projects-total': {
    title: 'No Active Projects!',
    description:
      'No projects found for you for the selected date range. Change the date filter or start a new project.',
  },

  'tasks-pending': {
    title: 'No Tasks are Pending',
    description:
      'No tasks are pending. Set reminders to stay on top of your to-dos and deadlines.',
  },
  'tasks-duethisweek': {
    title: 'No Tasks Due This Week',
    description:
      'No tasks due this week. Create new tasks "here" or finish upcoming tasks early in the "Pending" tab.',
  },
  'tasks-overdue': {
    title: 'No Tasks are Overdue',
    description:
      'Nice job! Nothing is overdue! Check all your tasks in the "Pending" tab to ensure nothing falls behind.',
  },

  'workflows-pending': {
    title: 'No Workflows are Pending!',
    description:
      'All done! No workflow is pending for you for the selected date range.',
  },
  'workflows-duethisweek': {
    title: 'No Workflows Due This Week!',
    description: 'All done! No workflow is pending for you for this week.',
  },
  'workflows-overdue': {
    title: 'No Workflows are Overdue',
    description:
      'Nice job staying on track! Review all workflows tabs to ensure everything is on time.',
  },
  'workflows-total': {
    title: 'No Active Workflows!',
    description:
      'No workflows found for you for the selected date range. Change the date filter or start a new workflow.',
  },

  'recommendations-pending': {
    title: `No ${recommendationName} are Pending!`,
    description:
      'All done! Nothing is pending for you for the selected date range.',
  },
  'recommendations-duethisweek': {
    title: `No ${recommendationName} Due This Week!`,
    description: 'All done! Nothing is pending for you for this week.',
  },
  'recommendations-overdue': {
    title: `No ${recommendationName} are Overdue`,
    description: `Nice job staying on track! Review all ${recommendationName.toLowerCase()} to ensure everything is on time.`,
  },
  'recommendations-total': {
    title: `No ${recommendationName} are Open!`,
    description: `No ${recommendationName.toLowerCase()} found for you for the selected date range. Change the date filter or start a new ${recommendationName.toLowerCase()}.`,
  },
});

export const projectDetailCountMap = () => ({
  reviews: {
    new: 0,
    pending: 0,
  },
  followups: {
    new: 0,
    pending: 0,
  },
  questions: {
    new: 0,
    pending: 0,
  },
  todos: {
    new: 0,
    pending: 0,
  },
  sents: {
    new: 0,
    pending: 0,
  },
  flags: {
    new: 0,
    pending: 0,
  },
  completed: {
    new: 0,
    pending: 0,
  },
});

export const myProjectTypeFilter = [
  { id: 'all', label: MyProjectTypeFilterEnum.All },
  { id: 'external', label: MyProjectTypeFilterEnum.EXTERNAL },
  { id: 'internal', label: MyProjectTypeFilterEnum.INTERNAL },
  { id: 'opportunityVault', label: MyProjectTypeFilterEnum.OPPORTUNITY_VAULt },
  { id: 'analystEvaluation', label: MyProjectTypeFilterEnum.ANALYST_EVALUTION },
];

export const myProjectFilter = [
  { id: 'myActive', label: MyProjectFilterEnum.ALL_ACTIVE },
  { id: 'mySent', label: MyProjectFilterEnum.MY_SENT },
  { id: 'myClosed', label: MyProjectFilterEnum.MY_CLOSED },
];
export const myProjectFilterCountMapper = () => ({
  [MyProjectFilterEnum.ALL_ACTIVE]: 0,
  [MyProjectFilterEnum.MY_SENT]: 0,
  [MyProjectFilterEnum.MY_CLOSED]: 0,
});

export const sidePanelCards: any = () => [
  {
    id: 'projects',
    title: 'My Projects',
    icon: 'documents',
    isActive: true,
    all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
    new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
  },
  {
    id: 'recommendations',
    title: 'My Recommendations',
    icon: 'dash-recommendation',
    isActive: false,
    all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
    new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
  },
  {
    id: 'workflows',
    title: 'My Workflows',
    icon: 'dash-workflow',
    isActive: false,
    all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
    new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
  },
  {
    id: 'tasks',
    title: 'My Tasks',
    icon: 'dash-check',
    infotext: 'Entity Related Open Tasks / Reminders Assigned To You',
    isActive: false,
    all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
    new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
  },
];

export const isOverDue = (due_at, start_over_due_date, end_over_due_date) => {
  return moment(due_at)
    .set({ hour: 23, minute: 59, second: 59 })
    .isBetween(moment(start_over_due_date), moment(end_over_due_date));
};

export const isDueThisWeek = (due_at, start_due_date, end_due_date) => {
  const dueDate = moment(due_at).startOf('day');
  const startDate = moment(start_due_date);
  const endDate = moment(end_due_date);

  return dueDate.isBetween(startDate, endDate, 'day', '[]');
};

export const isNew = (last_updated_at, last_view_time_stamp) => {
  return (
    last_updated_at &&
    moment(last_updated_at).isAfter(moment(last_view_time_stamp))
  );
};
