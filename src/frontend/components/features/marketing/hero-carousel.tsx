"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = ["/hero.jpg", "/hero-2.jpg", "/hero-3.jpg"];
const AUTOPLAY_MS = 7000;

const arrowClass =
  "absolute top-1/2 z-20 -translate-y-1/2 p-3 text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div aria-roledescription="carousel" aria-label="Featured photos">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className={`${arrowClass} left-4 sm:left-6`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
        className={`${arrowClass} right-4 sm:right-6`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="absolute bottom-20 left-1/2 z-20 hidden -translate-x-1/2 gap-2 sm:flex">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i === index ? "bg-white" : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
