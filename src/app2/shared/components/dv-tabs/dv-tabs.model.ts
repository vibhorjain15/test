export class dvTabsList {
  name: any; //  name to be displayed in the tabs
  link?: any; //  Link to be redirected when clicked on
  active: boolean; //  If the current tab is selected or not
  condition: boolean; // If the tabs should be displayed or not based on conditions
  tooltip?: string; // Tooltip describing the state
  disabled?: boolean; // Check to disable the tab
}
