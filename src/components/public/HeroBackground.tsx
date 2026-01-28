import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function HeroBackground({ bgImage, animationType = 'fade', duration = 6 }: { bgImage: string, animationType?: string, duration?: number }) {
    const [images, setImages] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (bgImage) {
            const list = bgImage.split(',').map(s => s.trim()).filter(Boolean);
            setImages(list.length > 0 ? list : [bgImage]);
        }
    }, [bgImage]);

    useEffect(() => {
        if (images.length > 0) {
            const img = new Image();
            img.src = images[currentIndex]; // Load current image
            img.onload = () => setLoaded(true);
        }
    }, [images, currentIndex]);

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % images.length);
        }, duration * 1000); // Dynamic Duration
        return () => clearInterval(timer);
    }, [images.length, duration]);

    if (images.length === 0) return null;

    // Define animation variants
    const variants = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 1.5, ease: "easeInOut" }
        },
        zoom: {
            initial: { opacity: 0, scale: 1.2 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: {
                opacity: { duration: 1 },
                scale: { duration: 1.5, ease: "easeOut" }
            }
        },
        slide: {
            initial: { opacity: 0, x: '20%' },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: '-20%' },
            transition: {
                opacity: { duration: 0.8 },
                x: { duration: 1.2, ease: "anticipate" }
            }
        },
        kenburns: {
            initial: { opacity: 0, scale: 1 },
            animate: { opacity: 1, scale: 1.15 },
            exit: { opacity: 0 },
            transition: {
                opacity: { duration: 2 },
                scale: { duration: duration + 1, ease: "linear" } // Dynamic Ken Burns Speed
            }
        }
    };

    const currentAnim = variants[animationType as keyof typeof variants] || variants.fade;

    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-900">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    className="absolute inset-0 bg-cover bg-top md:bg-center"
                    style={{
                        backgroundImage: `url(${images[currentIndex]})`,
                    }}
                    initial={currentAnim.initial}
                    animate={loaded ? currentAnim.animate : { opacity: 0 }}
                    exit={currentAnim.exit}
                    transition={currentAnim.transition as any}
                >
                    {/* Stronger gradient for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/60 to-slate-900/90"></div>
                </motion.div>
            </AnimatePresence>

            {/* Dots Indicator */}
            {images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-6' : 'bg-white/30'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
