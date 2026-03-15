import React from "react";

export interface IconifyIconProps extends React.HTMLAttributes<HTMLElement> {
  icon: string;
}

/** Wrapper for iconify-icon custom element (avoids JSX intrinsic type errors). */
export const IconifyIcon: React.FC<IconifyIconProps> = ({ icon, className, ...rest }) => {
  return React.createElement("iconify-icon", { icon, className, ...rest });
};
