import React from "react"
import { Link } from "react-router-dom"
import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import "./Header.css"

function Header() {
  return (
    <AppBar position="absolute" className="appBar">
      <Toolbar>
        <Box
          component="img"
          className="logo"
          alt="Logo"
          src={`${process.env.PUBLIC_URL}/logo.png`}
        />

        <Box sx={{ flexGrow: 1 }} />

        <Button color="inherit" component={Link} to="/">
          Home
        </Button>
        <Button color="inherit" component={Link} to="/about">
          About
        </Button>
        <Button color="inherit" component={Link} to="/references">
          References
        </Button>
        <Button color="inherit" component={Link} to="/contact">
          Contact us
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default Header
