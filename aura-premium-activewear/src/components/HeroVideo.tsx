import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Volume2, VolumeX, Sparkles } from 'lucide-react';
import videoSource from '../assets/hero-video.mp4';
import fallbackVideoSource from '../assets/hero-video.mp4';

interface HeroVideoProps {
  onExploreClick: () => void;
}

export default function HeroVideo({ onExploreClick }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // High quality royalty-free cinematic activewear/athletic loop videos from Pexels CDNs
  // const videoSource = '../assets/hero-video.mp4';
  //const fallbackVideoSource = '../assets/hero-video.mp4';

  return (
    <section id="hero-cinematic" className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-80 scale-105 filter brightness-75 contrast-110"
      >
        <source src={videoSource} type="video/mp4" />
        <source src={fallbackVideoSource} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Modern Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/70 z-1" />
      <div className="absolute inset-0 bg-black/30 z-1" />

      {/* Cinematic Text Overlay */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center space-x-2 bg-[#0c0c0c]/85 backdrop-blur-md border border-white/5 px-4 py-1.5 rounded-full mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase font-mono">
            DARVK V2 LAB COLLECTION • IN STOCK
          </span>
        </motion.div>

        {/* Dynamic Bold Typography (Incarnage energy) */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.25em', scale: 0.95 }}
          animate={{ opacity: 1, letterSpacing: '0.15em', scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black italic tracking-wider text-white uppercase leading-tight sm:leading-none font-display drop-shadow-2xl"
        >
          BORN FOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-600 to-red-700 not-italic">GRIND</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-4 sm:mt-6 text-[11px] sm:text-sm md:text-base text-zinc-400 font-semibold tracking-[0.15em] sm:tracking-[0.2em] max-w-2xl font-display uppercase"
        >
          ENGINEERED TO OUTWORK. DESIGNED TO STAND OUT.
        </motion.p>

        {/* Call to action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            id="hero-cta-shop"
            onClick={onExploreClick}
            className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-black tracking-[0.2em] text-xs px-10 py-4.5 transition-all duration-300 shadow-xl flex items-center justify-center space-x-2 uppercase hover:scale-105 rounded-sm"
          >
            <span>SHOP THE GEAR</span>
          </button>
          <button
            id="hero-cta-video"
            onClick={toggleMute}
            className="w-full sm:w-auto bg-black/50 backdrop-blur-md text-white hover:bg-white/10 font-bold tracking-[0.2em] text-xs px-8 py-4.5 transition-all duration-300 border border-white/5 flex items-center justify-center space-x-2 uppercase rounded-sm"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-500" />
                <span>UNMUTE ANTHEM</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span>MUTE CINEMATIC</span>
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Interactive Sound Indicator Alert (Transient helper toast) */}
      <div className="absolute bottom-24 right-6 z-10 hidden sm:block">
        <span className="text-[10px] text-white/40 tracking-widest uppercase font-mono">
          SOUND ENABLED FOR CINEMATIC INTENSITY
        </span>
      </div>

      {/* Downward Navigation Anchor */}
      <motion.button
        id="scroll-anchor"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
        onClick={onExploreClick}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60 hover:text-white flex flex-col items-center space-y-2 cursor-pointer focus:outline-none"
        aria-label="Scroll down"
      >
        <span className="text-[10px] tracking-[0.2em] font-semibold">EXPLORE CORE</span>
        <ArrowDown className="w-5 h-5 text-red-500" />
      </motion.button>
    </section>
  );
}
