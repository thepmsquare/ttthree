import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import "./stylesheets/App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
