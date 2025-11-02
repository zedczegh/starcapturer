import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2, Lock } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import NavBar from "@/components/NavBar";
import ReactMarkdown from "react-markdown";

const CriticalAnalysis = () => {
  const { isAdmin, loading } = useUserRole();
  const [markdown, setMarkdown] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Load the markdown document
    fetch("/src/docs/COMPUTATIONAL_AESTHETICS_SUBLIME.md")
      .then(res => res.text())
      .then(text => {
        setMarkdown(text);
        setLoadingDoc(false);
      })
      .catch(err => {
        console.error("Error loading document:", err);
        setLoadingDoc(false);
      });
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

        {/* Document Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-cosmic-900/50 backdrop-blur-sm border border-cosmic-700/30 rounded-lg p-8"
        >
          {loadingDoc ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
            </div>
          ) : (
            <div className="prose prose-invert prose-cosmic max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-cosmic-100 mt-8 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-cosmic-200 mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-cosmic-300 mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-cosmic-300 leading-relaxed mb-4">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-cosmic-300 space-y-1 mb-4 ml-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-cosmic-300 space-y-1 mb-4 ml-4">{children}</ol>
                  ),
                  code: ({ children }) => (
                    <code className="bg-cosmic-800/50 text-cosmic-200 px-1.5 py-0.5 rounded text-sm">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-cosmic-800/50 border border-cosmic-700/30 rounded-lg p-4 overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-cosmic-600 pl-4 italic text-cosmic-400 my-4">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-cosmic-400 hover:text-cosmic-300 underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CriticalAnalysis;
