export type DrawerKeyboardAction = "close" | "trap-focus" | "ignore";

export function drawerKeyboardAction(key: string): DrawerKeyboardAction {
  if (key === "Escape") return "close";
  if (key === "Tab") return "trap-focus";
  return "ignore";
}

export function shouldWrapDrawerFocus(shiftKey: boolean, activeIndex: number, lastIndex: number) {
  return shiftKey ? activeIndex === 0 : activeIndex === lastIndex;
}
