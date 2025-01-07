import React from "react"
import Box from "@mui/material/Box"
import "./Home.css"

function Home() {
  return (
    <div className="main-content">
      <Box
        component="img"
        src={`${process.env.PUBLIC_URL}/main.jpg`}
        alt="Background image"
        className="main-image"
      />
      <div className="overlay-text-big">
        Laivų statyba ir metalo konstrukcijos
      </div>
    </div>
  )
}

export default Home
