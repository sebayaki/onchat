import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ChannelIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m240-160 40-160h-160l20-80h160l40-160h-160l20-80h160l40-160h80l-40 160h160l40-160h80l-40 160h160l-20 80h-160l-40 160h160l-20 80h-160l-40 160h-80l40-160h-160l-40 160zm140-240h160l40-160h-160z" />
  </svg>
);

export const ChatIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m80-80v-720q0-33 23.5-56.5t56.5-23.5h640q33 0 56.5 23.5t23.5 56.5v480q0 33-23.5 56.5t-56.5 23.5h-560zm126-240h594v-480h-640v525zm-46 0v-480z" />
  </svg>
);

export const CheckIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m382-240-228-228 57-57 171 171 367-367 57 57z" />
  </svg>
);

export const CopyIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m360-240q-33 0-56.5-23.5t-23.5-56.5v-480q0-33 23.5-56.5t56.5-23.5h360q33 0 56.5 23.5t23.5 56.5v480q0 33-23.5 56.5t-56.5 23.5zm0-80h360v-480h-360zm-160 240q-33 0-56.5-23.5t-23.5-56.5v-560h80v560h440v80zm160-240v-480z" />
  </svg>
);

export const MenuIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m120-120v-80h480v80zm0-160v-80h720v80zm80-160q-33 0-56.5-23.5t-23.5-56.5v-240q0-33 23.5-56.5t56.5-23.5h560q33 0 56.5 23.5t23.5 56.5v240q0 33-23.5 56.5t-56.5 23.5zm0-80h560v-240h-560zm0 0v-240z" />
  </svg>
);

export const RewardIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m480-120-400-480 120-240h560l120 240zm-95-520h190l-60-120h-70zm55 347v-267h-222zm80 0 222-267h-222zm144-347h106l-60-120h-106zm-474 0h106l60-120h-106z" />
  </svg>
);

export const ShareIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z" />
  </svg>
);

export const ChevronDownIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M480-345 240-585l56-56 184 184 184-184 56 56z" />
  </svg>
);

export const PaletteIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 -960 960 960"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54-54 85.5-127T880-480q0 28-10.5 53.5T840-381q-19 19-45 29t-55 10q-31 0-52.5-21.5T666-415q0-31 21.5-52.5T740-520h60q0-133-93.5-226.5T480-840q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q21 0 35.5 14.5T530-110q0 21-14.5 35.5T480-60Zm0-520q25 0 42.5-17.5T540-660q0-25-17.5-42.5T480-720q-25 0-42.5 17.5T420-660q0 25 17.5 42.5T480-600Zm-160 80q25 0 42.5-17.5T380-580q0-25-17.5-42.5T320-640q-25 0-42.5 17.5T260-580q0 25 17.5 42.5T320-520Zm160 80q25 0 42.5-17.5T540-480q0-25-17.5-42.5T480-540q-25 0-42.5 17.5T420-480q0 25 17.5 42.5T480-440Zm160-80q25 0 42.5-17.5T700-580q0-25-17.5-42.5T640-640q-25 0-42.5 17.5T580-580q0 25 17.5 42.5T640-520Z" />
  </svg>
);
