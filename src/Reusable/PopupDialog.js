import React, { useState } from "react"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Button from "@mui/material/Button"
import OutlinedButton from "./OutlinedButton"
import OutlinedInput from "./OutlinedInput"

function PopupDialog({ buttonText, dialogTitle, dialogContent }) {
  const [open, setOpen] = useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div>
      <OutlinedButton text={buttonText} onClick={handleClickOpen} />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <div>{dialogContent}</div>
          <div style={{ marginTop: "16px" }}>
            {" "}
            {/* Optional margin for spacing */}
            <OutlinedInput label="Jūsų vardas *" />
          </div>
          <div style={{ marginTop: "16px" }}>
            {" "}
            {/* Optional margin for spacing */}
            <OutlinedInput label="Telefono numeris *" />
          </div>
        </DialogContent>
        <DialogActions>
          <Button>Pateikti užklausą</Button>
          <Button onClick={handleClose} color="primary">
            Uždaryti
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default PopupDialog
