import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hum Do — Ghar ka Hisaab",
    short_name: "Hum Do",
    description: "Husband aur wife ke liye shared income & expense tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6EF",
    theme_color: "#124D30",
    icons: [
      {
        src: "/Icon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/Icon/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
