"use client"

import { useEffect, useRef } from "react"

const GLYPHS = "ØΔ#/@[]{}()=+*^~|¬¦!¿?§$%&¢£₿0123456789"

interface ScrambleTextProps {
  text: string
  speed?: [number, number]
  className?: string
}

export function ScrambleText({ 
  text, 
  speed = [8, 20], 
  className = "" 
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const queue = useRef<Array<{
    from: string
    to: string
    start: number
    end: number
    char: string
  }>>([])
  const raf = useRef<number | null>(null)

  const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
  const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1) + a)

  const renderFrame = () => {
    let out = ""
    let done = 0
    
    for (let i = 0; i < queue.current.length; i++) {
      const q = queue.current[i]
      
      if (frame.current >= q.end) {
        done++
        out += q.to
      } else if (frame.current >= q.start) {
        if (!q.char || Math.random() < 0.28) {
          q.char = randomGlyph()
        }
        out += `<span class="scramble-alt">${q.char}</span>`
      } else {
        out += q.from
      }
    }
    
    if (ref.current) {
      ref.current.innerHTML = out
    }
    
    if (done === queue.current.length) {
      if (raf.current) cancelAnimationFrame(raf.current)
      return
    }
    
    frame.current++
    raf.current = requestAnimationFrame(renderFrame)
  }

  useEffect(() => {
    const el = ref.current
    const from = el?.textContent ?? ""
    const len = Math.max(from.length, text.length)
    
    queue.current = []
    for (let i = 0; i < len; i++) {
      const start = Math.floor(Math.random() * 10)
      const end = start + rand(speed[0], speed[1])
      queue.current.push({
        from: from[i] || "",
        to: text[i] || "",
        start,
        end,
        char: ""
      })
    }
    
    frame.current = 0
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(renderFrame)
    
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed[0], speed[1]])

  return <span ref={ref} className={className}></span>
}

