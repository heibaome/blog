"use client";

import { useEffect } from "react";
import mediumZoom from "medium-zoom";

export function ImageZoom() {
  useEffect(() => {
    const contentEl = document.querySelector(".prose");
    if (!contentEl) return;

    const images = contentEl.querySelectorAll("img");
    if (images.length === 0) return;

    // 给正文图片加上放大指针
    images.forEach((img) => {
      img.style.cursor = "zoom-in";
    });

    const zoom = mediumZoom(images, {
      margin: 24,
      background: "rgba(0, 0, 0, 0.9)",
      scrollOffset: 48,
    });

    return () => {
      zoom.detach();
    };
  }, []);

  return null;
}
