"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Linkedin, Youtube, X, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { StatsSection } from "@/components/stats-section"

const projects = [
  {
    id: 1,
    title: "GifterX Talks - TED Talks for Entrepreneurs",
    summary:
      "Premium event website for Christopher Kai's world-class entrepreneurship speaker series featuring past speakers like Elon Musk, TED founder Richard Saul Wurman, and Reebok co-founder Joe Foster",
    tags: ["Web App", "E-Commerce"],
    metric: "Speakers from 92 countries, 1,500+ world-class speakers",
    image: "/placeholder.jpg",
    demoUrl: "https://www.gifterxtalks.com/",
  },
  {
    id: 2,
    title: "Note My Life - Never Forget Your Life Lessons",
    summary:
      "Personal growth app that captures important insights, mistakes, and lessons learned, then reminds you at the right time so you never repeat the same mistakes twice",
    tags: ["Web App", "Personal Development", "AI"],
    metric: "Organize by life areas, Timely reminders, Build wisdom",
    image: "/placeholder.jpg",
    demoUrl: "https://notemylife.com",
  },
  {
    id: 3,
    title: "CEO Mission Control - AI Chief of Staff",
    summary:
      "Executive command center that consolidates priorities, focus hours, finances, and decisions into one AI-powered dashboard that understands what moves the needle",
    tags: ["Productivity", "AI", "SaaS"],
    metric: "AI priority scoring, Focus hours tracking, Real-time financial dashboard",
    image: "/placeholder.jpg",
    demoUrl: "https://ceo-mission-control-nine.vercel.app/",
  },
  {
    id: 4,
    title: "Aktiv Clean - Professional Cleaning Services",
    summary:
      "Modern business website for professional home and commercial cleaning services with booking, before/after showcases, and customer reviews",
    tags: ["Client Work", "Web App", "Services"],
    metric: "5-star rated, 6+ reviews, Full booking system",
    image: "/aktivclean.jpg",
    demoUrl: "https://v0-aktivcleanv2.vercel.app/",
  },
  {
    id: 5,
    title: "LimitlessOS - Operating System for Elite Performers",
    summary: "Vision tracking, deep work metrics, and accountability for founders, executives, and operators",
    tags: ["Productivity", "AI", "SaaS"],
    metric: "Vision-to-execution system for high performers",
    image: "/limitlessos.jpg",
    demoUrl: "https://limitlessos.vercel.app/",
  },
  {
    id: 6,
    title: "Nice Properties - Real Estate Listings Website",
    summary:
      "Professional real estate company website showcasing property listings with proven track record since 2017",
    tags: ["Real Estate", "Investment", "Client Work"],
    metric: "10/10 NPS Score, 7+ years experience, 10/10 tenant rating",
    image: "/nice-properties.jpg",
    demoUrl: "https://v0-niceproperties.vercel.app/",
  },
  {
    id: 7,
    title: "VictoryHub - Personal Goal Tracking & Reflection",
    summary:
      "Comprehensive personal development platform for goal setting, tracking, and daily reflection with journaling features",
    tags: ["Web App", "Productivity", "Personal Development"],
    metric: "Goal achievement system with reflection tools",
    image: "/victoryhub.jpg",
    demoUrl: "https://victoryhub.vercel.app/",
  },
  {
    id: 8,
    title: "Credit Card Fraud Detection Agent",
    summary: "AI-powered fraud detection system using OpenAI for real-time order validation and risk assessment",
    tags: ["AI", "AI Automation", "FinTech", "Enterprise"],
    metric: "Real-time fraud detection, Multi-agent orchestration",
    image: "/fraud-detection-agent.jpg",
    githubUrl: "https://github.com/nadvolod/order-processing-agents",
  },
  {
    id: 9,
    title: "Ultimate Test Metrics - AI-Powered GitHub Testing Intelligence",
    summary:
      "AI-driven test analysis platform that automatically reviews test quality, coverage, and risk for faster PR approvals",
    tags: ["AI", "DevOps", "SaaS", "Testing"],
    metric: "70% faster review time, Instant test analysis",
    image: "/ultimate-test-metrics.jpg",
    demoUrl: "https://v0-ultimatetestmetrics.vercel.app/",
  },
  {
    id: 10,
    title: "G Counsel Law - AI-Enhanced Legal Platform",
    summary:
      "Next-generation legal services website featuring an AI-powered chatbot for instant client support, consultation scheduling, and legal FAQ assistance",
    tags: ["Client Work", "AI", "Web App"],
    metric: "AI chatbot for 24/7 client support, Instant legal guidance",
    image: "/gcounsel-law-ai.jpg",
    demoUrl: "https://gcouncellaw-nfsyvu02d-nadvolods-projects.vercel.app/",
  },
  {
    id: 11,
    title: "G Counsel Law - Business Attorney Services",
    summary:
      "WordPress website and lead generation system for business law practice serving Maryland, DC, and West Virginia",
    tags: ["Client Work", "Web App", "Lead Generation"],
    metric: "Professional legal presence, Lead capture optimization",
    image: "/gcounsel-law.jpg",
    demoUrl: "https://gcounsellaw.com/about-us/",
  },
  {
    id: 12,
    title: "Healthcare Automation Program Development",
    summary:
      "Enterprise-grade test automation for a major healthcare organization with comprehensive CI/CD integration",
    tags: ["AI Automation", "DevOps", "Healthcare", "Enterprise"],
    metric: "Saved 900 minutes daily, 95%+ pass rate, 150+ API tests in <5 mins",
    image: "/healthcare-automation.jpg",
    caseStudyUrl: "https://ultimateqa.com/automation-development-for-healthcare-organization/",
  },
  {
    id: 13,
    title: "Abundance Board - Vision Manifestation Platform",
    summary:
      "Digital vision board platform helping users manifest their goals through visual affirmations and daily practice",
    tags: ["Web App", "Personal Development", "Client Work"],
    metric: "300% increase in user goal clarity, 80% active daily engagement",
    image: "/abundance-board.jpg",
    demoUrl: "https://myvision0.vercel.app/",
  },
  {
    id: 14,
    title: "VitaFlow - Luxury Wellness & IV Therapy Center",
    summary: "Premium wellness center in Miami Beach offering IV therapy, peptides, and holistic rejuvenation",
    tags: ["Healthcare", "E-Commerce", "Client Work"],
    metric: "40+ years medical expertise, Premium IV therapy & wellness",
    image: "/vitaflow-wellness.jpg",
    demoUrl: "https://v2vf.vercel.app/",
  },
  {
    id: 15,
    title: "UltimateQA - Software Development Services",
    summary: "Comprehensive software development and quality assurance platform with extensive learning resources",
    tags: ["Platform", "Education", "Testing"],
    metric: "68% faster deployment, 92% bug reduction, 3.5M+ learners",
    image: "/ultimateqa-services.jpg",
    demoUrl: "https://ultimateqa.vercel.app/",
  },
  {
    id: 16,
    title: "Nikolay Advolodkin - Personal Brand Site",
    summary:
      "Professional portfolio and thought leadership platform showcasing expertise in test automation and software quality",
    tags: ["Portfolio", "Personal Brand", "Client Work"],
    metric: "Authority positioning, 50K+ community reach, Industry recognition",
    image: "/nikolay-portfolio.jpg",
    demoUrl: "https://nikolaydev.vercel.app/",
  },
  {
    id: 17,
    title: "UltimateQA Main Platform",
    summary:
      "Leading test automation training and consulting platform serving developers and QA professionals worldwide",
    tags: ["Platform", "Education", "Enterprise"],
    metric: "$1M+ revenue, 250K+ students, Industry-leading courses",
    image: "/ultimateqa-main.jpg",
    demoUrl: "https://www.ultimateqa.com",
  },
]

const allTags = [
  "All",
  "Web App",
  "Mobile",
  "SaaS",
  "E-Commerce",
  "Client Work",
  "Healthcare",
  "FinTech",
  "AI",
  "AI Automation",
  "Enterprise",
  "Marketplace",
  "Education",
  "Accessibility",
  "DevOps",
  "Innovation",
  "Framework",
  "Private",
  "Real Estate",
  "Investment",
  "Biotech",
  "Productivity",
  "Lead Generation",
  "Personal Development",
]

export default function UltimateQAPortfolio() {
  const [selectedTag, setSelectedTag] = useState("All")
  const [sortBy, setSortBy] = useState("recent")
  const [showContactModal, setShowContactModal] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [showConfetti, setShowConfetti] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const rotatingWords = ["Better", "Faster", "Smarter"]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesTag = selectedTag === "All" || project.tags.includes(selectedTag)
      return matchesTag
    })

    if (sortBy === "popular") {
      filtered = [...filtered].reverse()
    }

    return filtered
  }, [selectedTag, sortBy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({ name: "", email: "", message: "" })
        setTimeout(() => {
          setShowContactModal(false)
          setSubmitStatus("idle")
        }, 2000)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToProjects = () => {
    const projectsSection = document.querySelector("#projects-section")
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleCTAClick = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1000)
    setShowContactModal(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-accent-brand to-accent-secondary bg-clip-text text-transparent">
              UltimateQA
            </span>
          </motion.div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowContactModal(true)}
              className="bg-accent-brand hover:bg-accent-brand/90 text-white font-medium"
            >
              Contact
            </Button>
          </div>
          {/* </CHANGE> */}
        </div>
      </motion.header>

      <section className="relative overflow-hidden border-b border-border/40 min-h-[50vh] flex items-center">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 opacity-20">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          {/* Floating Code Snippets */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`code-${i}`}
              className="absolute text-[10px] font-mono text-accent-brand/30"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.5,
              }}
            >
              {["const", "function", "return", "export", "import", "async"][i]}
            </motion.div>
          ))}

          {/* Neural Network Nodes */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`node-${i}`}
              className="absolute h-3 w-3 rounded-full bg-accent-brand/60 shadow-lg shadow-accent-brand/50"
              style={{
                left: `${15 + (i % 4) * 25}%`,
                top: `${20 + Math.floor(i / 4) * 30}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          ))}

          <svg className="absolute inset-0 h-full w-full opacity-30">
            {Array.from({ length: 8 }).map((_, i) => {
              const x1 = 15 + (i % 4) * 25
              const y1 = 20 + Math.floor(i / 4) * 30
              const x2 = 15 + ((i + 1) % 4) * 25
              const y2 = 20 + Math.floor((i + 1) / 4) * 30

              return (
                <motion.line
                  key={`line-${i}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
              )
            })}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>

          {Array.from({ length: 25 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute h-1 w-1 rounded-full bg-accent-secondary/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          ))}

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-accent-brand/20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.1, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-accent-secondary/20 blur-3xl"
          />
        </div>

        <div className="container relative mx-auto px-4 py-12 lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="mx-auto max-w-5xl"
          >
            <div className="mb-8 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold leading-tight tracking-tight lg:text-8xl"
              >
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-2"
                >
                  Build {rotatingWords[currentWordIndex]}.
                </motion.div>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="mb-10 text-xl text-muted-foreground lg:text-2xl max-w-3xl text-pretty leading-relaxed"
            >
              We create digital platforms and software that transform complexity into predictable growth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-accent-brand hover:bg-accent-brand/90 text-white font-medium text-lg px-8 h-14"
                  onClick={() => setShowContactModal(true)}
                >
                  Free Strategy Call
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent-brand/50 hover:bg-accent-brand/10 text-lg px-8 h-14 bg-transparent"
                  onClick={scrollToProjects}
                >
                  View Solutions
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <StatsSection onContact={() => setShowContactModal(true)} />

      <section className="border-b border-border/40 bg-muted/20 py-12 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Trusted By Industry Leaders
            </h2>
            <p className="text-2xl font-bold text-foreground">Customers & Partners</p>
          </motion.div>

          <div className="relative">
            <motion.div
              className="flex gap-12 items-center"
              animate={{
                x: [0, -1600],
              }}
              transition={{
                x: {
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  duration: 30,
                  ease: "linear",
                },
              }}
            >
              {[
                { name: "Forcoda", url: "https://forcoda.com" },
                { name: "Temporal", url: "https://temporal.io" },
                { name: "Applitools", url: "https://applitools.com" },
                { name: "TestJS Summit", url: "https://testjssummit.com" },
                { name: "Automation Guild", url: "https://automationguild.com" },
                { name: "TechBeacon", url: "https://techbeacon.com" },
                { name: "Test Automation University", url: "https://testautomationu.applitools.com" },
                { name: "G Counsel Law", url: "https://gcounsellaw.com" },
                // Duplicate for seamless loop
                { name: "Forcoda", url: "https://forcoda.com" },
                { name: "Temporal", url: "https://temporal.io" },
                { name: "Applitools", url: "https://applitools.com" },
                { name: "TestJS Summit", url: "https://testjssummit.com" },
                { name: "Automation Guild", url: "https://automationguild.com" },
                { name: "TechBeacon", url: "https://techbeacon.com" },
                { name: "Test Automation University", url: "https://testautomationu.applitools.com" },
                { name: "G Counsel Law", url: "https://gcounsellaw.com" },
              ].map((partner, index) => (
                <motion.a
                  key={`${partner.name}-${index}`}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="flex-shrink-0 flex items-center justify-center min-w-[200px] h-16 px-6 text-muted-foreground hover:text-foreground transition-colors border border-border/30 rounded-lg bg-background/50"
                >
                  <p className="font-semibold text-sm whitespace-nowrap">{partner.name}</p>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section id="projects-section" className="container mx-auto px-4 py-16 lg:px-8 lg:py-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredProjects.map((project, index) => {
              const isPrivate = project.tags.includes("Private")

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card
                    className={`group relative overflow-hidden border-border/50 bg-card transition-all duration-300 ${
                      !isPrivate ? "hover:shadow-2xl hover:shadow-accent-brand/10 hover:-translate-y-2" : "opacity-75"
                    }`}
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className={`h-full w-full object-cover transition-transform duration-500 ${
                          !isPrivate ? "group-hover:scale-110" : ""
                        }`}
                      />

                      {isPrivate && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-semibold text-foreground">Private Project</p>
                            <p className="text-xs text-muted-foreground mt-1">Not Available for Public Viewing</p>
                          </div>
                        </div>
                      )}

                      {!isPrivate && (
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      )}

                      {!isPrivate && (project.caseStudyUrl || project.demoUrl) && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                          {project.caseStudyUrl && (
                            <Link href={project.caseStudyUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-accent-brand hover:bg-accent-brand/90 text-white">
                                Case Study
                              </Button>
                            </Link>
                          )}
                          {project.demoUrl && (
                            <Link href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Demo
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="mb-2 text-xl font-bold text-balance">{project.title}</h3>
                      <p className="mb-4 text-sm text-muted-foreground text-pretty">{project.summary}</p>

                      <div className="mb-4 inline-block rounded-full bg-accent-brand/10 px-3 py-1 text-sm font-semibold text-accent-brand">
                        {project.metric}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <p className="text-xl text-muted-foreground">No projects found matching your criteria.</p>
          </motion.div>
        )}
      </section>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="fixed bottom-8 right-8 z-40"
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-accent-brand px-4 py-2 text-sm font-medium text-white shadow-lg"
            >
              Let's build something amazing! 🚀
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-accent-brand" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showConfetti &&
            Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: ["#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"][i % 5],
                }}
              />
            ))}
        </AnimatePresence>

        <motion.div
          whileHover={{
            scale: 1.05,
            rotate: [0, -5, 5, -5, 0],
            transition: { rotate: { duration: 0.5 } },
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={handleCTAClick}
            className="rounded-full bg-accent-brand hover:bg-accent-brand/90 text-white font-medium shadow-2xl shadow-accent-brand/30 px-6 h-14 text-base relative overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-white"
            />
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="relative z-10"
            >
              Free Strategy Call
            </motion.span>
          </Button>
        </motion.div>
      </motion.div>

      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                © 2025 UltimateQA. Turning brand vision into visible, profitable digital reality.
              </p>
            </div>

            <div className="flex gap-4">
              <Link
                href="https://www.linkedin.com/company/ultimate-qa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent-brand/10">
                  <Linkedin className="h-5 w-5" />
                </Button>
              </Link>
              <Link
                href="https://www.youtube.com/@UltimateQA"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent-brand/10">
                  <Youtube className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl relative"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContactModal(false)}
                className="absolute right-4 top-4 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>

              <h2 className="mb-2 text-2xl font-bold">Let's Grow Your Brand</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Ready to transform your digital presence? Fill out the form below and we'll get back to you within 24
                hours.
              </p>

              {submitStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <div className="mb-4 text-4xl">✓</div>
                  <h3 className="mb-2 text-xl font-bold text-accent-brand">Message Sent!</h3>
                  <p className="text-muted-foreground">We'll be in touch soon.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your project..."
                      className="w-full min-h-[120px]"
                    />
                  </div>

                  {submitStatus === "error" && (
                    <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-accent-brand hover:bg-accent-brand/90 text-white"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowContactModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
