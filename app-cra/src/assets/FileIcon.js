import * as React from "react";

const FileIcon = ({ filled = false, icon }) => (
  <svg width="85" height="87" fill="none">
    <path
      d="M70.334 11.366c1.784 0 3.241 1.475 3.241 3.28v65.44c0 1.806-1.457 3.28-3.241 3.28H18.817c-1.785 0-3.242-1.474-3.242-3.28v-65.44c0-1.805 1.457-3.28 3.242-3.28h51.517z"
      fill="#FFA26E"
    />
    <path
      d="M66.264 9.63a3.136 3.136 0 013.129 3.13v62.41a3.136 3.136 0 01-3.13 3.13H16.536a3.136 3.136 0 01-3.129-3.13V12.76a3.136 3.136 0 013.13-3.13h49.728zm0-1.405H16.535A4.546 4.546 0 0012 12.76v62.41a4.546 4.546 0 004.535 4.536h49.729a4.546 4.546 0 004.535-4.535V12.76a4.546 4.546 0 00-4.535-4.535z"
      fill="#581166"
    />
    <path
      d="M62.493 14.799v58.333H20.306V14.799h42.187zm1.055-1.406H19.25a.353.353 0 00-.352.351v60.442c0 .194.159.352.352.352h44.297a.353.353 0 00.351-.352V13.744a.353.353 0 00-.351-.351z"
      fill="#581166"
    />
    <path d="M62.493 14.799V73.14H20.306V14.799h42.187z" fill={filled ? "#FFEDE6" : "#FFA26E"} />
    <path
      d="M41.355 2.406a7.752 7.752 0 017.366 5.309l.316.967h3.296v6.758H30.36V8.682h3.296l.317-.967a7.79 7.79 0 017.383-5.309zm0-1.406a9.17 9.17 0 00-8.7 6.275h-3.692v9.572h24.785v-9.58h-3.691A9.174 9.174 0 0041.355 1z"
      fill="#581166"
    />
    <path d="M41.355 2.406a7.752 7.752 0 017.366 5.309l.316.967h3.296v6.758H30.36V8.682h3.296l.317-.967a7.79 7.79 0 017.383-5.309z" fill="#FF5855" />
    <path d="M39.747 8.919a1.608 1.608 0 103.217 0 1.608 1.608 0 00-3.217 0z" fill="#fff" />
    <path
      d="M55.857 57.25H26.854a.705.705 0 00-.704.703c0 .387.317.703.704.703h29.003a.705.705 0 00.703-.703.705.705 0 00-.703-.703zm0 5.098H26.854a.705.705 0 00-.704.703c0 .386.317.703.704.703h29.003a.705.705 0 00.703-.703.705.705 0 00-.703-.703zM39.554 43.803h-12.7a.705.705 0 00-.704.703c0 .387.317.703.704.703h12.7a.705.705 0 00.703-.703.705.705 0 00-.703-.703zm0 5.097h-12.7a.705.705 0 00-.704.703c0 .387.317.704.704.704h12.7a.705.705 0 00.703-.704.705.705 0 00-.703-.703z"
      fill={filled ? "#581166" : "#FFA26E"}
    />
    <path d="M66.575 49.877v-6.198M66.575 41.023v-2.657" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M26 73.5C26 80.404 20.404 86 13.5 86S1 80.404 1 73.5a12.412 12.412 0 011.389-5.732 12.537 12.537 0 016.944-6.057A12.478 12.478 0 0113.5 61C20.404 61 26 66.596 26 73.5z"
      fill="#fff"
    />
    <path
      d="M4.619 64.704a12.555 12.555 0 00-1.627 2.023m4.027-3.918A12.442 12.442 0 0113.5 61C20.404 61 26 66.596 26 73.5S20.404 86 13.5 86 1 80.404 1 73.5a12.602 12.602 0 01.558-3.704"
      stroke="#581166"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    {icon === "autotest" && (
      <path
        d="M8.379 69.212a3 3 0 000 4.243l5.121 5.121 5.121-5.121a3 3 0 00-4.242-4.243l-.879.879-.879-.879a3 3 0 00-4.242 0z"
        fill="#FFCBAE"
        stroke="#581166"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
    {icon === "image" && (
      <>
        <path
          d="M6.75 70.75a1.5 1.5 0 011.5-1.5h.697a1.5 1.5 0 001.248-.668l.61-.914A1.5 1.5 0 0112.053 67h2.894c.502 0 .97.25 1.248.668l.61.914a1.5 1.5 0 001.248.668h.697a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H8.25a1.5 1.5 0 01-1.5-1.5v-6.75z"
          fill="#FFCBAE"
        />
        <path d="M15.75 73.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" fill="#FFCBAE" />
        <path
          d="M6.75 70.75a1.5 1.5 0 011.5-1.5h.697a1.5 1.5 0 001.248-.668l.61-.914A1.5 1.5 0 0112.053 67h2.894c.502 0 .97.25 1.248.668l.61.914a1.5 1.5 0 001.248.668h.697a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H8.25a1.5 1.5 0 01-1.5-1.5v-6.75z"
          stroke="#581166"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M15.75 73.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" stroke="#581166" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
    {icon === "sanitaire" && (
      <>
        <path
          d="M20.323 69.738A9.465 9.465 0 0113.5 67.33a9.464 9.464 0 01-6.822 2.406 9.517 9.517 0 00-.303 2.388c0 4.427 3.028 8.146 7.125 9.2 4.097-1.054 7.125-4.773 7.125-9.2 0-.825-.105-1.625-.302-2.387z"
          fill="#FFCBAE"
        />
        <path
          d="M11.125 74.5l1.583 1.583 3.167-3.166m4.448-3.18A9.465 9.465 0 0113.5 67.33a9.464 9.464 0 01-6.822 2.407 9.517 9.517 0 00-.303 2.388c0 4.427 3.028 8.146 7.125 9.2 4.097-1.054 7.125-4.773 7.125-9.2 0-.825-.105-1.625-.302-2.387z"
          stroke="#581166"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
    {icon === "reglement" && (
      <>
        <rect x="8.719" y="68.188" width="9.563" height="11.688" rx="1" fill="#FFCBAE" />
        <path d="M11.375 68.542c0-.783.634-1.417 1.417-1.417h1.416a1.417 1.417 0 010 2.833h-1.416a1.417 1.417 0 01-1.417-1.416z" fill="#FFCBAE" />
        <path
          d="M11.8 74.492a.6.6 0 00-.85.849l.85-.849zm.992 1.841l-.425.425a.6.6 0 00.849 0l-.424-.425zm3.257-2.409a.6.6 0 00-.848-.848l.848.848zm1.81-3.966v8.5h1.2v-8.5h-1.2zm-.817 9.317H9.958v1.2h7.084v-1.2zm-7.9-.817v-8.5h-1.2v8.5h1.2zm.816-9.316h1.417v-1.2H9.958v1.2zm5.667 0h1.417v-1.2h-1.417v1.2zM9.958 79.275a.817.817 0 01-.816-.817h-1.2c0 1.114.903 2.017 2.016 2.017v-1.2zm7.9-.817a.817.817 0 01-.816.817v1.2a2.017 2.017 0 002.016-2.017h-1.2zm1.2-8.5a2.017 2.017 0 00-2.016-2.016v1.2c.45 0 .816.365.816.816h1.2zm-9.916 0c0-.45.365-.816.816-.816v-1.2a2.017 2.017 0 00-2.016 2.016h1.2zm1.809 5.383l1.416 1.417.849-.849-1.417-1.417-.848.849zm2.265 1.417l2.833-2.834-.848-.848-2.834 2.833.849.849zm-.424-9.033h1.416v-1.2h-1.416v1.2zm1.416 1.633h-1.416v1.2h1.416v-1.2zm-1.416 0a.817.817 0 01-.817-.816h-1.2c0 1.113.903 2.016 2.017 2.016v-1.2zm2.233-.816a.817.817 0 01-.817.816v1.2a2.017 2.017 0 002.017-2.016h-1.2zm-.817-.817c.451 0 .817.366.817.817h1.2a2.017 2.017 0 00-2.017-2.017v1.2zm-1.416-1.2a2.017 2.017 0 00-2.017 2.017h1.2c0-.451.366-.817.817-.817v-1.2z"
          fill="#581166"
        />
      </>
    )}
  </svg>
);

export default FileIcon;
