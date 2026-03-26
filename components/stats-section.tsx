"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { JSX } from "react"

const stats = [
  { numericValue: 10, suffix: "/10", label: "NPS Score", sublabel: "3 Years Running", icon: "star" },
  { numericValue: 24, suffix: "hrs", label: "To 2 Prototypes", sublabel: "Rapid Delivery", icon: "zap" },
  { numericValue: 7, suffix: " Days", label: "Full Website", sublabel: "Design to Launch", icon: "rocket" },
  { numericValue: 100, suffix: "%", label: "Money Back", sublabel: "Guarantee", icon: "shield" },
]

function CountUp({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    const duration = 1800
    const steps = 40
    const stepTime = duration / steps
    const increment = target / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      // Easing: slow start, fast middle, slow end
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      current = Math.round(eased * target)
      setCount(current)

      if (step >= steps) {
        setCount(target)
        clearInterval(timer)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [inView, target])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

const iconPaths: Record<string, JSX.Element> = {
  star: (
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  zap: (
    <path
      d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  rocket: (
    <>
      <path
        d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  shield: (
    <>
      <path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
}

export function StatsSection({ onContact }: { onContact: () => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} className="border-b border-border/40 bg-muted/10 py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: i * 0.15,
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              className="stat-shimmer relative text-center p-6 lg:p-8 rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden cursor-default"
            >
              {/* Glow behind the value */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-accent-brand/15 blur-2xl stat-glow" />

              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, rotate: -20, scale: 0 }}
                whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.15 + 0.3,
                  type: "spring",
                  stiffness: 200,
                }}
                className="relative mx-auto mb-3 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-accent-brand/10 flex items-center justify-center text-accent-brand"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 lg:w-6 lg:h-6"
                >
                  {iconPaths[stat.icon]}
                </svg>
              </motion.div>

              {/* Counting value */}
              <div className="relative text-3xl lg:text-5xl font-bold bg-gradient-to-r from-accent-brand to-accent-secondary bg-clip-text text-transparent mb-2">
                <CountUp
                  target={stat.numericValue}
                  suffix={stat.suffix}
                  inView={isInView}
                />
              </div>

              {/* Label with underline animation */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: "40%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 + 0.5 }}
                className="mx-auto h-px bg-gradient-to-r from-transparent via-accent-brand/50 to-transparent mb-3"
              />

              <div className="text-sm font-semibold text-foreground">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
