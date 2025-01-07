import React from "react"
import TextField from "@mui/material/TextField"
import "./OutlinedInput.css" // Import the CSS file

function OutlinedInput({ label, ...props }) {
  return (
    <TextField
      variant="outlined"
      label={label}
      {...props} // Spread additional props
    />
  )
}

export default OutlinedInput
