import React from "react"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Header from "./Main/Header"
import Footer from "./Main/Footer"
import Home from "./Main/Routes/Home"
import About from "./Main/Routes/About"
import References from "./Main/Routes/References"
import Contact from "./Main/Routes/Contact"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/references" element={<References />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
