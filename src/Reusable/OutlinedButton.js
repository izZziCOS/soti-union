import React from "react"
import Button from "@mui/material/Button"
import "./OutlinedButton.css" // Import the CSS file

function OutlinedButton({ text, onClick, ...props }) {
  return (
    <Button
      variant="outlined" // Ensures the button has a border
      color="inherit" // Inherit color from the theme (e.g., white border, white text)
      className="outlined-button" // Apply the custom CSS class
      onClick={onClick}
      {...props} // Spread additional props
    >
      {text}
    </Button>
  )
}

export default OutlinedButton
