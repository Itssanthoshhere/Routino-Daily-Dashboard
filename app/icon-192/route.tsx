import { ImageResponse } from "next/og";
export const dynamic = "force-static";
export function GET() { return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#A4161A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 140, fontWeight: 700 }}>r</div>, { width: 192, height: 192 }); }
