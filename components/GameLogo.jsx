import React from "react";

// Centralized Game Logo component
// To change the logo globally, just change the src path here!
export default function GameLogo({ className = "w-10 h-10", ...props }) {
  return (
    <img 
      src="/images/logo.png" 
      alt="حيلهم بينهم" 
      className={`object-contain ${className}`}
      {...props} 
    />
  );
}
