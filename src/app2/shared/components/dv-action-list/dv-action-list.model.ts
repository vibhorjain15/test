/**
 * Interface for `DVActionList`.
 */
export interface IDVActionList {
  /**
   * The object reference where the `dv-action-list` is being used.
   */
  context: any;

  /**
   * The array of action list item.
   */
  actionItems: Array<IDVActionListItem>;

  /**
   * The tooltip message visible on `More Options`.
   */
  moreOptionTooltip?: string;
}

/**
 * Interface for `DVActionList` item.
 */
export interface IDVActionListItem {
  /**
   * The unique identifier.
   */
  key: string;

  /**
   * Action item icon.
   */
  icon?: string;

  /**
   * For internal action list purpose.
   */
  identifier?: string;

  /**
   * Action item label.
   */
  label?: string;

  /**
   * Action item tooltip.
   */
  tooltip?: string;

  /**
   * Determines whether the action item is disabled or not.
   */
  isDisabled: boolean;

  /**
   * Determines whether its currently loading or not.
   */
  isLoading: boolean;

  /**
   * Determines the visiblity of action item.
   */
  isVisible: boolean;
}
