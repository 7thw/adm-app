"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React, { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";

// Glass Effect Component
const GlassEffect = ({
  children,
  className = "",
  style = {},
  tint = "rgba(255, 255, 255, 0.25)", // Default tint
  hoverTint = "rgba(255, 255, 255, 0.35)", // Default hover tint
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tint?: string;
  hoverTint?: string;
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <motion.div
      className={`relative flex font-semibold overflow-hidden text-black cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
      initial={{ background: tint }}
      whileHover={{ background: hoverTint }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit rounded-[inherit]"
        style={{
          backdropFilter: "blur(3px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit rounded-[inherit]"
        style={{ background: tint }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit rounded-[inherit] overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 w-full">{children}</div>
    </motion.div>
  );
};

// SVG Filter Component
const GlassFilter = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  tint?: string;
  hoverTint?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, tint, hoverTint, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <GlassEffect
        className={cn(
          buttonVariants({ variant, size, className }),
          "p-0 rounded-full overflow-hidden" // Ensure GlassEffect doesn't add extra padding/rounding
        )}
        tint={tint}
        hoverTint={hoverTint}
        style={{
          transition: "all 0.7s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        }}
      >
        <Comp
          className="relative z-30 w-full h-full flex items-center justify-center bg-transparent text-white"
          ref={ref}
          {...props}
        />
      </GlassEffect>
    );
  },
);
Button.displayName = "Button";

const formatTime = (seconds: number = 0) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({
  value,
  onChange,
  className,
  tint = "rgba(255, 255, 255, 0.25)",
  hoverTint = "rgba(255, 255, 255, 0.35)",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  tint?: string;
  hoverTint?: string;
}) => {
  return (
    <GlassEffect
      className={cn(
        "relative w-full h-2 rounded-full cursor-pointer p-0", // Increased height for better interaction
        className,
      )}
      tint={tint}
      hoverTint={hoverTint}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        onChange(Math.min(Math.max(percentage, 0), 100));
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-white rounded-full"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </GlassEffect>
  );
};

const AudioPlayer = ({
  src,
  cover,
  title,
}: {
  src: string;
  cover?: string;
  title?: string;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isFinite(progress) ? progress : 0);
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value / 100) * audioRef.current.duration;
      if (isFinite(time)) {
        audioRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const handleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  if (!src) return null;

  const cardLightTint = "rgba(255, 255, 255, 0.25)";
  const cardLightHoverTint = "rgba(255, 255, 255, 0.35)";
  const playbarMidTint = "rgba(255, 255, 255, 0.15)";
  const playbarMidHoverTint = "rgba(255, 255, 255, 0.25)";
  const audioButtonUpTint = "rgba(255, 255, 255, 0.05)";
  const audioButtonUpHoverTint = "rgba(255, 255, 255, 0.15)";


  return (
    <AnimatePresence>
      <GlassFilter />
      <motion.div
        className="relative flex flex-col mx-auto w-[320px] h-auto" // Wider player
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
          delay: 0.1,
          type: "spring",
        }}
        layout
      >
        <GlassEffect className="rounded-3xl p-4" tint={cardLightTint} hoverTint={cardLightHoverTint}> {/* Increased padding */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            src={src}
            className="hidden"
          />

          <motion.div
            className="flex flex-col relative"
            layout
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Cover  */}
            {cover && (
              <motion.div className="bg-white/20 overflow-hidden rounded-2xl h-[200px] w-full relative"> {/* Adjusted cover radius and height */}
                <img
                  src={cover}
                  alt="cover"
                  className="!object-cover w-full my-0 p-0 !mt-0 border-none !h-full"
                />
              </motion.div>
            )}

            <motion.div className="flex flex-col w-full gap-y-3 mt-3"> {/* Increased gap and margin */}
              {/* Title */}
              {title && (
                <motion.h3 className="text-white font-bold text-lg text-center"> {/* Larger title */}
                  {title}
                </motion.h3>
              )}

              {/* Slider */}
              <motion.div className="flex flex-col gap-y-2"> {/* Increased gap */}
                <CustomSlider
                  value={progress}
                  onChange={handleSeek}
                  className="w-full"
                  tint={playbarMidTint}
                  hoverTint={playbarMidHoverTint}
                />
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-white text-sm">
                    {formatTime(duration)}
                  </span>
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div className="flex items-center justify-center w-full">
                <GlassEffect
                  className="flex items-center gap-4 w-fit rounded-2xl p-3" // Increased gap and padding, adjusted radius
                  tint={playbarMidTint}
                  hoverTint={playbarMidHoverTint}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShuffle();
                    }}
                    className={cn(
                      "text-white h-9 w-9 rounded-full", // Slightly larger buttons
                      isShuffle && "bg-[#111111d1] text-white",
                    )}
                    tint={audioButtonUpTint}
                    hoverTint={audioButtonUpHoverTint}
                  >
                    <Shuffle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="text-white h-9 w-9 rounded-full"
                    tint={audioButtonUpTint}
                    hoverTint={audioButtonUpHoverTint}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-white h-10 w-10 rounded-full" // Main play button slightly larger
                    tint={audioButtonUpTint}
                    hoverTint={audioButtonUpHoverTint}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" /> // Larger icon
                    ) : (
                      <Play className="h-6 w-6" /> // Larger icon
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="text-white h-9 w-9 rounded-full"
                    tint={audioButtonUpTint}
                    hoverTint={audioButtonUpHoverTint}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRepeat();
                    }}
                    className={cn(
                      "text-white h-9 w-9 rounded-full",
                      isRepeat && "bg-[#111111d1] text-white",
                    )}
                    tint={audioButtonUpTint}
                    hoverTint={audioButtonUpHoverTint}
                  >
                    <Repeat className="h-5 w-5" />
                  </Button>
                </GlassEffect>
              </motion.div>
            </motion.div>
          </motion.div>
        </GlassEffect>
      </motion.div>
    </AnimatePresence>
  );
};

const AudioPlayerDemo = () => {
  return (
    <AudioPlayer
      src="https://ui.webmakers.studio/audio/ncs.mp3"
      cover="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      title="NEFFEX & TOKYO MACHINE"
    />
  );
};

export default AudioPlayerDemo;
