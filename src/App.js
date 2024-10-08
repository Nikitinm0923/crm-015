import "./App.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Auth from "./components/auth";
import Home from "./components/Home";

import "bootstrap/dist/css/bootstrap.min.css";
import "highcharts/css/annotations/popup.css";
import "highcharts/css/stocktools/gui.css";
import "./components/style.css";
import "./components/responsive.css";

const App = () => {
  const [isLogin] = useState(() =>
    localStorage.getItem("USER") ? true : false
  );

  useEffect(() => {
    const root = document.getElementById("root");
    if (isLogin) {
      root.removeAttribute("style");
      return;
    }
  }, [isLogin]);

  useEffect(() => {
    const html = document.querySelector("html");
    const theme = localStorage.getItem("THEME") || "dark";
    if (theme !== "dark") html.classList.add(theme);
  }, []);

  const protectedRouter = createBrowserRouter(
    createRoutesFromElements(<Route path="/" Component={Home} />)
  );
  const router = createBrowserRouter(
    createRoutesFromElements(<Route path="/" Component={Auth} />)
  );

  return <RouterProvider router={isLogin ? protectedRouter : router} />;
};

export default App;
