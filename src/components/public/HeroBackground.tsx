
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function HeroBackground({ bgImage }: { bgImage: string }) {
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = bgImage;
        img.onload = () => setImgLoaded(true);
    }, [bgImage]);

    return (
        <motion.div
            className="absolute inset-0 bg-cover bg-top md:bg-center"
            style={{
                backgroundImage: `url(${bgImage})`,
                opacity: 0
            }}
            animate={{
                scale: [1.1, 1],
                opacity: imgLoaded ? 1 : 0
            }}
            transition={{
                scale: { duration: 10, ease: "linear" },
                opacity: { duration: 0.8, ease: "easeOut" }
            }}
        >
            {/* Stronger gradient for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/50 to-slate-900/80"></div>
        </motion.div>
    );
}
