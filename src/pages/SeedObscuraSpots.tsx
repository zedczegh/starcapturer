import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { seedObscuraSpots, obscuraLocations } from "@/utils/seedObscuraSpots";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Temporary page to seed obscura spots
 * Navigate to /seed-obscura-spots to use this
 */
const SeedObscuraSpots: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<any>(null);
  const navigate = useNavigate();

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedObscuraSpots();
      setResults(result);
      
      if (result.success) {
        toast.success(`Created ${result.successCount} obscura spots. ${result.failCount} failed.`);
      } else {
        toast.error(result.error || "Failed to seed spots");
      }
    } catch (error) {
      toast.error("Failed to seed obscura spots");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4">Seed Obscura Spots</h1>
        <p className="text-muted-foreground mb-6">
          This page will create {obscuraLocations.length} obscura spots from Atlas Obscura.
          Make sure you're logged in as yanzeyucq@163.com before seeding.
        </p>

        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Locations to be created:</h2>
          <ul className="list-disc list-inside space-y-2">
            {obscuraLocations.map((loc, index) => (
              <li key={index} className="text-sm">
                <strong>{loc.name}</strong> - {loc.description.substring(0, 60)}...
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handleSeed} 
            disabled={isSeeding}
            size="lg"
          >
            {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSeeding ? "Seeding..." : "Seed Obscura Spots"}
          </Button>
          
          <Button 
            onClick={() => navigate("/")} 
            variant="outline"
            size="lg"
          >
            Back to Home
          </Button>
        </div>

        {results && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
            <p>✅ Success: {results.successCount || 0}</p>
            <p>❌ Failed: {results.failCount || 0}</p>
            
            {results.results && (
              <div className="mt-4 space-y-2">
                {results.results.map((r: any, i: number) => (
                  <div key={i} className="text-sm">
                    {r.success ? "✅" : "❌"} {r.location}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SeedObscuraSpots;
