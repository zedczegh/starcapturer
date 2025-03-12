
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from "@/components/NavBar";

const AboutSIQS = () => {
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">About Sky Image Quality Score (SIQS)</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What is SIQS?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Sky Image Quality Score (SIQS) is a comprehensive rating system designed 
                  specifically for astrophotographers to evaluate the quality of potential imaging 
                  locations based on multiple environmental factors.
                </p>
                <p>
                  SIQS provides a standardized way to assess and compare different locations for 
                  astrophotography, helping you find the perfect spot for your next imaging session.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Factors Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">CC</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Cloud Cover</h3>
                      <p className="text-sm text-muted-foreground">
                        The percentage of sky covered by clouds, directly impacting visibility of celestial objects.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">LP</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Light Pollution (Bortle Scale)</h3>
                      <p className="text-sm text-muted-foreground">
                        A numerical scale that quantifies the night sky's brightness due to artificial light.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">SC</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Seeing Conditions</h3>
                      <p className="text-sm text-muted-foreground">
                        The steadiness of the atmosphere, measured in arcseconds, affecting image sharpness.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">WS</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Wind Speed</h3>
                      <p className="text-sm text-muted-foreground">
                        Higher wind speeds can cause telescope vibration and degrade image quality.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">HM</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Humidity</h3>
                      <p className="text-sm text-muted-foreground">
                        Higher humidity increases dew risk on optical surfaces and can reduce transparency.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">MP</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Moon Phase</h3>
                      <p className="text-sm text-muted-foreground">
                        The phase of the moon affects sky brightness and contrast for deep sky imaging.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How SIQS Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  SIQS analyzes multiple environmental factors and combines them using our proprietary 
                  algorithm to generate a single score from 0-100 that represents the overall quality 
                  of a location for astrophotography.
                </p>
                <p>
                  Each factor is weighted based on its relative importance to image quality, with 
                  cloud cover and light pollution having the most significant impact on the final score.
                </p>
                <p>
                  A location is considered viable for imaging if it meets our minimum threshold 
                  criteria, with higher scores indicating better conditions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Score Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Exceptional (80-100)</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "100%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Perfect conditions for all types of astrophotography</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Excellent (60-79)</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-400" style={{ width: "75%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Very good conditions for most imaging targets</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Good (40-59)</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400" style={{ width: "50%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Acceptable conditions for brighter objects</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Fair (20-39)</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400" style={{ width: "30%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Limited imaging potential, consider planetary targets</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Poor (0-19)</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: "15%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Not recommended for imaging</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutSIQS;
