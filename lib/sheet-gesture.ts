/** How far (px) or how fast (px/s) a sheet must be pulled down before letting go closes it. */
export const SHEET_DISMISS_DISTANCE = 120;
export const SHEET_DISMISS_SPEED = 600;

/** Whether a downward drag on a sheet's handle should close the sheet. */
export function shouldDismissSheet(offsetY: number, velocityY: number): boolean {
  return offsetY > SHEET_DISMISS_DISTANCE || velocityY > SHEET_DISMISS_SPEED;
}
