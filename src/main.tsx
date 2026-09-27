import { createRoot } from "react-dom/client";
import { Runs } from "./Runs";
import "./runs.css";
if (import.meta.env.DEV && new URLSearchParams(location.search).has("attention")) {
  import("./AttentionApp");
} else createRoot(document.getElementById("root")!).render(<Runs />);
