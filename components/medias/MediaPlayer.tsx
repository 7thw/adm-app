"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconVolume,
  IconVolumeOff
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

interface MediaPlayerProps {
  src: string
  title?: string
  description?: string
  onError?: (error: string) => void
  className?: string
}

export default function MediaPlayer({
  src,
  title = "Audio",
  description = "",
  onError,
  className = ""
}: MediaPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format time for display
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        setIsLoading(true)
        // Load the audio first to ensure sources are properly loaded
        audioRef.current.load()
        await audioRef.current.play()
        setIsLoading(false)
      }
    } catch (err) {
      setIsLoading(false)
      const errorMsg = `Playback failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('Play error details:', err)
    }
  }

  // Handle seeking
  const handleSeek = (newTime: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime[0]
      setCurrentTime(newTime[0])
    }
  }

  // Handle volume
  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
    setIsMuted(vol === 0)
  }

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  // Skip functions
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
    }
  }

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handleError = () => {
      const errorMsg = `Failed to load audio: ${src}`
      setError(errorMsg)
      setIsLoading(false)
      onError?.(errorMsg)
    }
    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
    }
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [src, onError])

  // Media Session API for browser controls
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator && audioRef.current) {
      const audio = audioRef.current

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Audio Track',
          artist: 'Realigna',
          album: 'Media Library',
          artwork: [
            { src: '/favicon.ico', sizes: '96x96', type: 'image/x-icon' }
          ]
        })

        navigator.mediaSession.setActionHandler('play', () => audio.play())
        navigator.mediaSession.setActionHandler('pause', () => audio.pause())
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const skipTime = details.seekOffset || 10
          audio.currentTime = Math.max(audio.currentTime - skipTime, 0)
        })
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skipTime = details.seekOffset || 10
          audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration)
        })
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.fastSeek && 'fastSeek' in audio) {
            (audio as any).fastSeek(details.seekTime)
            return
          }
          audio.currentTime = details.seekTime || 0
        })
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          audio.currentTime = 0
        })
      } catch (error) {
        console.warn('Media Session API not fully supported:', error)
      }
    }
  }, [title])

  if (!src) {
    return (
      <div className={`p-4 border rounded-lg bg-muted ${className}`}>
        <p className="text-sm text-muted-foreground">No audio source available</p>
      </div>
    )
  }

  // Process and validate the source URL
  useEffect(() => {
    // Reset error state when src changes
    setError(null);
    
    // Basic URL validation
    if (!src) {
      const errorMsg = 'No media URL provided';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    
    if (typeof src === 'string' && src.trim() === '') {
      const errorMsg = 'Empty media URL provided';
      setError(errorMsg);
      onError?.(errorMsg);
    }
    
    // Log URL for debugging but don't display in UI
    console.log('MediaPlayer source URL:', src);
  }, [src, onError]);

  return (
    <div className={`p-4 border rounded-lg bg-card shadow-sm ${className}`}>
      <audio 
        ref={audioRef} 
        preload="metadata"
        onError={(e) => {
          console.error('Audio element error:', e);
          const errorMsg = `Failed to load audio: ${e.currentTarget.error?.message || 'Unknown error'}`;
          setError(errorMsg);
          onError?.(errorMsg);
        }}
      >
        {/* Use source elements with multiple types for better browser compatibility */}
        <source src={src} type="audio/mpeg" />
        <source src={src} type="audio/mp3" />
        <source src={src} type="audio/wav" />
        <source src={src} type="audio/ogg" />
        <source src={src} />
        Your browser does not support the audio element.
      </audio>

      {/* Title */}
      <div className="mb-3">
        <h4 className="font-medium text-sm">{title}</h4>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={skipBackward}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <IconPlayerSkipBackFilled className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="h-10 w-10"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          ) : isPlaying ? (
            <IconPlayerPauseFilled className="h-5 w-5" />
          ) : (
            <IconPlayerPlayFilled className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={skipForward}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <IconPlayerSkipForwardFilled className="h-4 w-4" />
        </Button>

        {/* Volume Control */}
        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted || volume === 0 ? (
              <IconVolumeOff className="h-4 w-4" />
            ) : (
              <IconVolume className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="w-16"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          onValueChange={handleSeek}
          max={duration || 100}
          step={1}
          className="w-full"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
