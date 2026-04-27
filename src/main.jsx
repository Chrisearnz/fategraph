@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  margin: 0;
  padding: 0;
  background: #020617;
  min-height: 100%;
}
import React from "react";
import ReactDOM from "react-dom/client";
import FateGraph from "./FateGraph.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FateGraph />
  </React.StrictMode>
);
