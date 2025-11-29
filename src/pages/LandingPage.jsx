import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import FinanceBackground from "../components/LiquidEther.jsx";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const featureCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  hover: {
    y: -10,
    transition: { duration: 0.3 }
  }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

export default function LandingPage() {
  const features = [
    {
      icon: "📊",
      title: "Smart Financial Coaching",
      desc: "AI-powered insights adapted to your unique income patterns and spending habits"
    },
    {
      icon: "💰",
      title: "Gig Worker Friendly",
      desc: "Handle variable income with confidence.  Track irregular earnings and plan accordingly"
    },
    {
      icon: "🎯",
      title: "Goal-Oriented",
      desc: "Set financial goals and let our AI coach guide you to achieve them proactively"
    },
    {
      icon: "📈",
      title: "Real-Time Insights",
      desc: "Track transactions, analyze spending patterns, and get actionable recommendations"
    }
  ];

  const businessModels = [
    {
      icon: "💳",
      title: "SaaS Licensing Fee",
      subtitle: "Primary Revenue Stream",
      description: "A flat per-user, per-month fee for access to the core Agentic AI platform and its APIs.",
      example: "IDFC FIRST pays $0.50/month per active mobile banking user provisioned for AI assistant feature",
      metrics: ["Per-User Model", "Recurring Revenue", "Scalable"],
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: "🎁",
      title: "Cross-Sell/Referral Commission",
      subtitle: "Success-Based Revenue",
      description: "A Success-Based Commission based on product conversion driven directly by the AI agent's recommendation.",
      example: "Agent suggests $5,000 monthly surplus user invest in IDFC FIRST Mutual Fund SIP.  On conversion: bank pays 0.1% of invested amount",
      metrics: ["Performance-Based", "Win-Win Model", "High ROI"],
      color: "from-cyan-600 to-blue-600"
    },
    {
      icon: "📊",
      title: "API Data Insight Fee",
      subtitle: "Premium Tier - DaaS",
      description: "Fee for providing banks' internal teams with anonymized, aggregated financial intelligence (Data-as-a-Service).",
      example: "Bank accesses dashboard showing 'Top 5 Overspending Categories' or 'Risk Score based on Income Volatility' across entire customer base",
      metrics: ["Data Analytics", "Higher Margins", "Strategic Value"],
      color: "from-green-600 to-cyan-600"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-950 overflow-x-hidden">
      {/* Hero Section with Finance Background */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        {/* Background animation */}
        <div className="absolute inset-0 z-0">
          <FinanceBackground />
        </div>

        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/30 z-5" />

        {/* Hero Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo/Branding */}
          <motion. div
            className="mb-8 flex items-center gap-3 justify-center cursor-target"
            variants={itemVariants}
          >
            <motion.div
              className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-2xl shadow-blue-500/50 cursor-target"
              whileHover={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.7)" }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M6 6h12M6 18h12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion. div>
            <motion.span
              className="text-white font-bold text-3xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-target"
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              FinBuddy
            </motion.span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg cursor-target"
            variants={itemVariants}
          >
            Your Personal AI{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Financial Coach
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-gray-300 mb-8 font-medium drop-shadow-md max-w-3xl leading-relaxed cursor-target"
            variants={itemVariants}
          >
            Designed for gig workers, informal sector employees, and everyday citizens. <br />
            Adapt to real income variability and make{" "}
            <span className="text-cyan-400 font-semibold">smarter financial decisions</span>{" "}
            proactively.
          </motion. p>

          {/* CTA Buttons */}
          <motion. div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            variants={itemVariants}
          >
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/register"
                className="group cursor-target inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-xl shadow-blue-600/50 transition-all duration-300 text-lg"
              >
                Get Started Free
                <motion.span
                  className="inline-block ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/login"
                className="cursor-target inline-block px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-lg shadow-lg border border-white/30 transition-all duration-300 text-lg"
              >
                Sign In
              </Link>
            </motion. div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-300"
            variants={itemVariants}
          >
            {[
              "No credit card required",
              "Bank-level security",
              "Free forever plan"
            ].map((indicator, idx) => (
              <motion. div
                key={idx}
                className="flex items-center gap-2 cursor-target"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16. 707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1. 414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {indicator}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-gray-950 relative z-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4 text-center cursor-target">
              Why FinBuddy? 
            </h2>
            <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto cursor-target">
              Designed specifically for your financial journey, whether you're earning regularly or on a flexible schedule. 
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="group cursor-target p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl"
                variants={featureCardVariants}
                whileHover="hover"
              >
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gray-950 relative z-20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-white mb-16 text-center cursor-target"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                num: "01",
                title: "Connect Your Finances",
                desc: "Securely link your bank accounts.  We use industry-leading encryption to keep your data safe.",
                icon: "🔗"
              },
              {
                num: "02",
                title: "Get Personalized Insights",
                desc: "Our AI analyzes your patterns and provides tailored recommendations for your situation.",
                icon: "🤖"
              },
              {
                num: "03",
                title: "Achieve Your Goals",
                desc: "Follow guided steps, track progress, and watch your financial dreams become reality.",
                icon: "🎯"
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="cursor-target text-center group"
                variants={itemVariants}
                whileHover={{ y: -20 }}
              >
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                >
                  {step.icon}
                </motion. div>
                <motion.div
                  className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {step.num}
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion. div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-950 to-gray-900 relative z-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4 text-center cursor-target">
              Our Business Model
            </h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto cursor-target text-lg">
              Multiple revenue streams designed to create sustainable value for financial institutions and deliver powerful AI-driven insights to millions of users.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {businessModels.map((model, idx) => (
              <motion. div
                key={idx}
                className="group cursor-target relative"
                variants={featureCardVariants}
                whileHover="hover"
              >
                {/* Card Background with Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-0. 5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl" />
                </div>

                {/* Card Content - Fixed Height */}
                <div className="relative h-full flex flex-col p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl group-hover:border-gray-600/50 transition-colors duration-300">
                  {/* Icon */}
                  <motion.div
                    className="text-5xl mb-4"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: idx * 0.3 }}
                  >
                    {model.icon}
                  </motion.div>

                  {/* Subtitle Badge */}
                  <motion. div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${model.color} mb-3 w-fit`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {model.subtitle}
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-2">{model.title}</h3>

                  {/* Description */}
                  <p className="text-gray-300 mb-4 leading-relaxed text-sm">
                    {model.description}
                  </p>

                  {/* Divider */}
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded mb-4" />

                  {/* Example Section */}
                  <motion.div
                    className="bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-lg p-4 mb-4 border border-gray-600/30 flex-grow"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 }}
                  >
                    <p className="text-xs font-semibold text-cyan-400 uppercase mb-2">Example</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{model.example}</p>
                  </motion.div>

                  {/* Metrics - Fixed 3 items max */}
                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Key Benefits</p>
                    <div className="flex flex-wrap gap-2">
                      {model.metrics.map((metric, midx) => (
                        <motion.span
                          key={midx}
                          className="px-2 py-1 text-xs rounded bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 whitespace-nowrap"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.2 + midx * 0.1 }}
                        >
                          {metric}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button - Always at bottom */}
                  <motion.button
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 mt-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Learn More
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-950 border-t border-gray-800 relative z-20">
        <div className="max-w-6xl mx-auto text-center text-gray-500">
          <p>&copy; 2025 FinBuddy. All rights reserved.  | Your AI Financial Coach for Gig Economy</p>
          <motion.div
            className="mt-4 flex justify-center gap-6 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.a
              href="#"
              className="cursor-target hover:text-gray-400 transition"
              whileHover={{ scale: 1.1 }}
            >
              Privacy Policy
            </motion.a>
            <motion.a
              href="#"
              className="cursor-target hover:text-gray-400 transition"
              whileHover={{ scale: 1.1 }}
            >
              Terms of Service
            </motion.a>
            <motion.a
              href="#"
              className="cursor-target hover:text-gray-400 transition"
              whileHover={{ scale: 1.1 }}
            >
              Contact Us
            </motion.a>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}