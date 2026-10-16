'use client'
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";

export type SlideData = {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    categoryTag: string;
    buttonText: string;
    url: string;
    img: string;
    bg: string;
};

const SliderClient = ({ slides }: { slides: SlideData[] }) => {
    const [current, setCurrent] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Touch swipe state
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }, [slides.length]);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === ' ') { e.preventDefault(); setIsAutoPlaying(p => !p); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsAutoPlaying(false);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextSlide() : prevSlide();
        }
        touchStartX.current = null;
        touchEndX.current = null;
        setIsAutoPlaying(true);
    };

    if (!slides.length) return null;

    return (
        <div
            className="overflow-hidden relative"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="flex transition-transform ease-in-out duration-700"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`relative bg-gradient-to-br ${slide.bg} w-full flex-shrink-0 h-56 sm:h-64 md:h-72 xl:h-[22rem]`}
                        style={{ minWidth: "100%" }}
                    >
                        {/* One photo with a navy fade, so the headline stays readable and the banner stays short.
                            slide.description and slide.categoryTag are still read from the CMS but not shown. */}
                        <Image
                            src={slide.img}
                            alt={slide.title}
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1E2235]/90 via-[#1E2235]/45 to-transparent" />

                        <div className="absolute inset-0 flex flex-col items-start justify-end md:justify-center gap-3 px-4 pb-10 md:pb-0 md:px-8 lg:px-16 xl:px-32 2xl:px-64 text-left">
                            <h1 className="max-w-xl text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-white whitespace-pre-line leading-tight">
                                {slide.title}
                            </h1>
                            {slide.subtitle && (
                                <p className="hidden md:block text-base lg:text-lg font-bold text-brand-gold">
                                    {slide.subtitle}
                                </p>
                            )}
                            <Link href={slide.url || "/"}>
                                <button className="rounded-lg bg-brand-gold text-black font-bold py-2.5 px-6 text-sm hover:bg-brand-gold-dark active:scale-95 transition-all duration-200">
                                    {slide.buttonText || "SHOP NOW"}
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Prev / Next arrows — hidden on mobile */}
            <button
                onClick={prevSlide}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-brand-gold hover:text-black backdrop-blur-sm rounded-full items-center justify-center text-white transition-colors z-10"
                aria-label="Previous slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-brand-gold hover:text-black backdrop-blur-sm rounded-full items-center justify-center text-white transition-colors z-10"
                aria-label="Next slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => { setCurrent(index); setIsAutoPlaying(false); }}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                            current === index
                                ? "w-6 h-2.5 bg-brand-gold"
                                : "w-2.5 h-2.5 bg-white/40 hover:bg-brand-gold/70"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default SliderClient;