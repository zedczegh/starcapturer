
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface SIQSSummaryProps {
  siqs: number;
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
  isViable: boolean;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqs, factors = [], isViable }) => {
  // Calculate a color based on SIQS score (still using 0-100 internally)
  const getSiqsColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-green-400";
    if (score >= 40) return "bg-yellow-400";
    if (score >= 20) return "bg-orange-400";
    return "bg-red-500";
  };

  // Convert 0-100 scale to 0-10 scale for display
  const formatSiqsScore = (score: number) => {
    return (score / 10).toFixed(1);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Sky Image Quality Score</CardTitle>
          <Badge variant={isViable ? "default" : "destructive"} className="ml-2">
            {isViable ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {isViable ? "Viable" : "Not Viable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{formatSiqsScore(siqs)}</span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <span className="text-sm text-muted-foreground mt-1">Overall Quality Score</span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full ${getSiqsColor(siqs)}`} 
              style={{ width: `${siqs}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          {factors && factors.length > 0 ? (
            factors.map((factor, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <span className="text-sm">{formatSiqsScore(factor.score)}/10</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getSiqsColor(factor.score)}`} 
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>No factor data available for this location.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SIQSSummary;
