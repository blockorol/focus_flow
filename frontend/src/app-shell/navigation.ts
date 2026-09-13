export type AppNavItem = {
  label: string;
  href: string;
  description: string;
  disabled?: boolean;
};

export const appNavItems: AppNavItem[] = [
  { label: 'Flows', href: '/', description: 'Root Focus workspaces' },
  { label: 'Goals', href: '#goals', description: 'Goal progress across Focuses', disabled: true },
];

export function isActiveNavItem(pathname: string, item: AppNavItem) {
  if (item.disabled) return false;
  return pathname === item.href;
}