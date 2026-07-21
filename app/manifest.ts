import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hum Do — Ghar ka Hisaab",
    short_name: "Hum Do",
    description: "Husband aur wife ke liye shared income & expense tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6EF",
    theme_color: "#16A34A",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
