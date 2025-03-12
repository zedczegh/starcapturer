
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { shareAstroSpot } from "@/lib/api";
import { Share, Camera, X, Upload, Loader2 } from "lucide-react";

interface ShareLocationFormProps {
  userLocation?: { latitude: number; longitude: number; name?: string } | null;
  siqs?: number;
  isViable?: boolean;
  onClose?: () => void;
}

const ShareLocationForm: React.FC<ShareLocationFormProps> = ({
  userLocation,
  siqs = 0,
  isViable = false,
  onClose
}) => {
  const [name, setName] = useState(userLocation?.name || "");
  const [latitude, setLatitude] = useState(userLocation?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(userLocation?.longitude?.toString() || "");
  const [description, setDescription] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [targets, setTargets] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !latitude || !longitude || !description.trim() || !photographer.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Parse coordinates
    const latValue = parseFloat(latitude);
    const longValue = parseFloat(longitude);
    
    if (isNaN(latValue) || isNaN(longValue)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process targets into an array
      const targetsArray = targets
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);
        
      // Share the astro spot
      shareAstroSpot({
        name,
        latitude: latValue,
        longitude: longValue,
        description,
        photographer,
        photoUrl: photoUrl || undefined,
        targets: targetsArray.length > 0 ? targetsArray : undefined,
        siqs: siqs || 0,
        isViable: isViable || false,
        timestamp: new Date().toISOString(),
      });
      
      // Reset form
      setName("");
      setDescription("");
      setPhotographer("");
      setPhotoUrl("");
      setTargets("");
      
      // Close the form if callback provided
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error("Error sharing location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Share className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>Share Your Astrophotography Spot</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Share your favorite stargazing location with the community
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Mount Wilson Observatory"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input 
                id="latitude" 
                value={latitude} 
                onChange={(e) => setLatitude(e.target.value)} 
                placeholder="e.g., 34.2256"
                required
                type="number"
                step="0.000001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input 
                id="longitude" 
                value={longitude} 
                onChange={(e) => setLongitude(e.target.value)} 
                placeholder="e.g., -118.0692"
                required
                type="number"
                step="0.000001"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the location and what makes it good for astrophotography..."
              required
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photographer">Your Name/Username *</Label>
            <Input 
              id="photographer" 
              value={photographer} 
              onChange={(e) => setPhotographer(e.target.value)} 
              placeholder="e.g., StarChaser42"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targets">Recommended Targets (comma-separated)</Label>
            <Input 
              id="targets" 
              value={targets} 
              onChange={(e) => setTargets(e.target.value)} 
              placeholder="e.g., Andromeda Galaxy, Pleiades, Jupiter"
            />
            <p className="text-xs text-muted-foreground">
              List astronomical objects that are good to photograph from this location
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input 
              id="photoUrl" 
              value={photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
              placeholder="https://example.com/your-astrophoto.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Share a URL to a photo you've taken at this location
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share className="h-4 w-4 mr-2" />
                  Share Location
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShareLocationForm;
