import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Routino — Daily Workspace", short_name: "Routino", description: "Tasks, notes, habits, and focus in one calm workspace.", start_url: "/dashboard", shortcuts: [{name:"Quick Capture",short_name:"Capture",description:"Capture a task, note, or scratchpad entry",url:"/dashboard?action=capture"},{name:"Tasks",description:"Open your tasks",url:"/dashboard?tab=tasks"},{name:"Focus Timer",short_name:"Focus",description:"Open the focus timer",url:"/dashboard?action=focus"}], scope: "/", display: "standalone", background_color: "#fbfcf8", theme_color: "#A4161A", icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" }] };
}
