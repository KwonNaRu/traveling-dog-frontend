"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./Carousel.module.scss";

interface CarouselProps {
    children: React.ReactNode[];
    slidesToShow?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    showDots?: boolean;
    showArrows?: boolean;
}

export default function Carousel({ children, slidesToShow = 1, autoplay = false, autoplaySpeed = 3000, showDots = false, showArrows = true }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(0);
    const [isTouching, setIsTouching] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const totalSlides = children.length;
    const maxIndex = Math.max(0, totalSlides - slidesToShow);

    // 넘길 페이지가 없는 경우 (내용물 갯수가 slidesToShow보다 적거나 같을 때)
    const hasNavigation = totalSlides > slidesToShow;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (autoplay && !isTouching && hasNavigation) {
            timer = setInterval(() => {
                goToNext();
            }, autoplaySpeed);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [autoplay, autoplaySpeed, currentIndex, isTouching, hasNavigation]);

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : maxIndex));
    };

    const goToSlide = (index: number) => {
        const slideIndex = Math.max(0, Math.min(index, maxIndex));
        setCurrentIndex(slideIndex);
    };

    // 터치 이벤트 핸들러 (모바일용)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!hasNavigation) return;
        setTouchStartX(e.touches[0].clientX);
        setIsTouching(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isTouching || !hasNavigation) return;
        const touchX = e.touches[0].clientX;
        const diff = touchStartX - touchX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToNext();
            } else {
                goToPrev();
            }
            setIsTouching(false);
        }
    };

    const handleTouchEnd = () => {
        setIsTouching(false);
    };

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.carousel} ref={carouselRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div
                    className={styles.carouselTrack}
                    style={{
                        transform: hasNavigation ? `translateX(-${currentIndex * (100 / totalSlides)}%)` : "translateX(0)",
                        width: hasNavigation ? `${(100 * totalSlides) / slidesToShow}%` : "100%",
                        justifyContent: !hasNavigation ? "center" : "flex-start",
                    }}
                >
                    {children.map((child, index) => (
                        <div
                            key={index}
                            className={styles.carouselItem}
                            style={{
                                width: `${100 / totalSlides}%`,
                                maxWidth: !hasNavigation ? `${100 / slidesToShow}%` : "none",
                            }}
                        >
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            {hasNavigation && (
                <div className={styles.carouselControls}>
                    {showArrows && (
                        <button onClick={goToPrev} className={`${styles.carouselButton} ${styles.prevButton}`} disabled={currentIndex === 0}>
                            &lt;
                        </button>
                    )}

                    {showDots && (
                        <div className={styles.carouselDots}>
                            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                                <button key={index} className={`${styles.carouselDot} ${index === currentIndex ? styles.activeDot : ""}`} onClick={() => goToSlide(index)} />
                            ))}
                        </div>
                    )}

                    {showArrows && (
                        <button onClick={goToNext} className={`${styles.carouselButton} ${styles.nextButton}`} disabled={currentIndex === maxIndex}>
                            &gt;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
