import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2, Lock, ExternalLink } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import NavBar from "@/components/NavBar";

const CriticalAnalysis = () => {
  const { isAdmin, loading } = useUserRole();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-950 text-cosmic-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cosmic-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cosmic-950 text-cosmic-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Lock className="h-16 w-16 text-cosmic-400 mx-auto" />
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-cosmic-300">This page is only accessible to administrators.</p>
          <Link to="/about">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to About
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-16 relative overflow-hidden">
      <NavBar />
      
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 2 + 1}px`,
              width: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{
              opacity: [
                Math.random() * 0.3 + 0.1,
                Math.random() * 0.5 + 0.2,
                Math.random() * 0.3 + 0.1
              ]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      <div className="container max-w-5xl mx-auto px-5 py-8 md:py-10 relative z-10 pt-20">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/about">
            <Button variant="ghost" size="sm" className="mr-2 text-cosmic-200 hover:text-cosmic-50 hover:bg-cosmic-800/50">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to About
            </Button>
          </Link>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-cosmic-400" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cosmic-100 to-cosmic-300 bg-clip-text text-transparent">
              Critical Analysis
            </h1>
          </div>
          <p className="text-cosmic-300 text-lg">
            Beyond the Kantian Sublime: Computational Aesthetics in Three-Dimensional Astrophotography and Sonification
          </p>
        </motion.div>

        {/* Document Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Abstract */}
          <div className="bg-cosmic-900/50 backdrop-blur-sm border border-cosmic-700/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cosmic-100 mb-4">Abstract</h2>
            <p className="text-cosmic-300 leading-relaxed mb-4">
              This paper examines five computational methodologies for transforming two-dimensional astrophotography into experiential artistic outputs: stereoscopic depth mapping, three-dimensional star field generation, parallel video synthesis, astronomical sonification, and mathematical equation extraction. Grounded in Kantian and Burkean theories of the Sublime, we position these algorithms as technological extensions of the human capacity to experience cosmic awe.
            </p>
            <p className="text-cosmic-300 leading-relaxed">
              Drawing inspiration from J.P. Metsävainio's volumetric astrophotography, Max Tegmark's Mathematical Universe Hypothesis, and Goethe's <em>Farbenlehre</em>, we demonstrate how computational aesthetics democratizes sublime astronomical experience through browser-based processing.
            </p>
          </div>

          {/* Key Contributions */}
          <div className="bg-cosmic-900/50 backdrop-blur-sm border border-cosmic-700/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cosmic-100 mb-4">Key Contributions to New Knowledge</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-cosmic-400 mt-1">•</span>
                <span className="text-cosmic-300">Unified stereoscopic processing combining traditional morphological displacement with AI-enhanced depth estimation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cosmic-400 mt-1">•</span>
                <span className="text-cosmic-300">Real-time 3D star field rendering with diffraction spike preservation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cosmic-400 mt-1">•</span>
                <span className="text-cosmic-300">Synchronized parallel video generation maintaining temporal coherence across stereo channels</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cosmic-400 mt-1">•</span>
                <span className="text-cosmic-300">Harmonic sonification mapping celestial luminance to musical frequencies</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cosmic-400 mt-1">•</span>
                <span className="text-cosmic-300">Reverse-engineering mathematical structures from astrophotographic imagery</span>
              </li>
            </ul>
          </div>

          {/* Theoretical Framework */}
          <div className="bg-cosmic-900/50 backdrop-blur-sm border border-cosmic-700/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cosmic-100 mb-4">Theoretical Framework</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-cosmic-200 mb-2">The Kantian Sublime</h3>
                <p className="text-cosmic-300">
                  Kant (1790) distinguished the mathematical sublime—evoked by magnitude beyond comprehension—from the dynamical sublime, provoked by nature's overwhelming power. Our computational methodologies restore the third dimension, addressing what Nye (1994) termed the "technological sublime."
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cosmic-200 mb-2">Artistic Precedents</h3>
                <p className="text-cosmic-300 mb-2">
                  <strong>J.P. Metsävainio</strong> pioneered volumetric 3D conversions of nebulae using manual depth assignment. Our stereoscope processor automates and democratizes his methodology, replacing manual masking with algorithmic depth extraction.
                </p>
                <p className="text-cosmic-300">
                  <strong>Max Tegmark's Mathematical Universe Hypothesis</strong> posits that physical reality <em>is</em> mathematics. Our Astro Math processor literalizes this proposition, extracting equations from astrophotographic imagery.
                </p>
              </div>
            </div>
          </div>

          {/* Five Processors Overview */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-fuchsia-950/30 to-pink-950/30 border border-fuchsia-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-fuchsia-200 mb-2">1. Stereoscope Processor</h3>
              <p className="text-sm text-cosmic-300">
                Transforms 2D astrophotography into 3D through depth mapping, creating "perceptual depth maps" that evoke the feeling of depth rather than astronomical truth.
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-cyan-200 mb-2">2. 3D Star Field Generator</h3>
              <p className="text-sm text-cosmic-300">
                Extracts 2D star positions and assigns z-depth, rendering navigable 3D cosmic structures with diffraction spike preservation.
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-950/30 to-orange-950/30 border border-amber-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-amber-200 mb-2">3. Parallel Video Generator</h3>
              <p className="text-sm text-cosmic-300">
                Extends stereoscopy into temporal sequences with frame-by-frame coherence, enabling VR-compatible stereo video output.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-950/30 to-violet-950/30 border border-purple-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-purple-200 mb-2">4. Sonification Processor</h3>
              <p className="text-sm text-cosmic-300">
                Creates synesthetic translations mapping visual qualities to auditory domains, accessing the dynamical sublime through sound.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-950/30 to-red-950/30 border border-orange-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-orange-200 mb-2">5. Astro Math Processor</h3>
              <p className="text-sm text-cosmic-300">
                Extracts Fourier series, parametric equations, and fractal dimensions—revealing mathematical structures underlying cosmic forms.
              </p>
            </div>
          </div>

          {/* Conclusion */}
          <div className="bg-cosmic-900/50 backdrop-blur-sm border border-cosmic-700/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cosmic-100 mb-4">Democratizing the Sublime</h2>
            <p className="text-cosmic-300 leading-relaxed mb-4">
              By translating Metsävainio's manual artistry into automated algorithms, Tegmark's mathematical philosophy into computational extraction, and Goethe's color phenomenology into synesthetic mapping, we create <strong>accessible portals to the sublime</strong>.
            </p>
            <p className="text-cosmic-300 leading-relaxed">
              The computational sublime is not lesser than the natural sublime—it is an <em>extension</em>, using algorithmic mediation to reveal structures invisible to unaided perception. When viewers witness their photograph transform into navigable 3D space, hear its harmonic translation, or discover its hidden equations, they experience what Kant called "the mind's movement."
            </p>
          </div>

          {/* Full Document Link */}
          <div className="bg-cosmic-800/30 border border-cosmic-600/30 rounded-lg p-6 text-center">
            <p className="text-cosmic-300 mb-4">
              For the complete academic paper with full citations, methodology, and references:
            </p>
            <a 
              href="https://github.com/yanzeyuStarcapturer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cosmic-700 hover:bg-cosmic-600 text-cosmic-50 rounded-lg transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              View Full Paper on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CriticalAnalysis;
