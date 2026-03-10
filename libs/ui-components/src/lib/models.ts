export interface SidebarMenuItem {
  label: string;
  icon: string;
  route: string;
  children?: SidebarMenuItem[];
  badge?: string;
  badgeColor?: string;
}

export interface TableAction {
  action: string;
  icon: string;
  color?: string;
  tooltip?: string;
  disabledWhen?: (row: any) => boolean;
  disabledTooltip?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'actions';
  width?: string;
  format?: string;
  actions?: TableAction[];
}

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

export interface TabItem {
  label: string;
  route: string;
  icon?: string;
  badge?: string;
}

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  hideCancel?: boolean;
}
