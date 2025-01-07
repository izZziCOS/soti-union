import React, { useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import "./SplitContentSwitcher.css"

const contentData = [
  {
    imageSrc: `${process.env.PUBLIC_URL}/motorcycle-kawasaki.jpg`,
    text: `<strong>Variklis:</strong>  998 cm³ keturių cilindrų.<br>
           <strong>Elektronika:</strong>  IMU.<br>
           <strong>Pakaba:</strong>  Showa Balance Free Front Forks.<br>
           <strong>Aerodinamika:</strong>  Integruoti sparnai.<br>
           <strong>Pavarų perjungiklis:</strong>  Greito pavarų perjungimo sistema.
           <br><br>
           <strong>Kaina 1d. -</strong>  150€<br>`,
  },
]

function SplitContentSwitcher() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % contentData.length)
  }

  const handlePrevious = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + contentData.length) % contentData.length,
    )
  }

  return (
    <Box className="split-container">
      <Box className="split-image">
        <IconButton className="nav-button left" onClick={handlePrevious}>
          <ArrowBackIosIcon />
        </IconButton>
        <img
          src={contentData[currentIndex].imageSrc}
          alt="Content"
          className="content-image"
        />
      </Box>
      <Box className="split-text">
        <Typography
          variant="body1"
          className="content-text"
          dangerouslySetInnerHTML={{ __html: contentData[currentIndex].text }}
        />
        <IconButton className="nav-button right" onClick={handleNext}>
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
    </Box>
  )
}

export default SplitContentSwitcher
