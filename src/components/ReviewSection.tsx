
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getLocationReviews } from "@/lib/api";
import { MessageSquare, Star, Image as ImageIcon, Loader2 } from "lucide-react";

interface ReviewSectionProps {
  locationId: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ locationId }) => {
  const [reviews, setReviews] = useState(() => getLocationReviews(locationId));
  const [reviewText, setReviewText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authorName.trim()) {
      toast({
        title: "Input Error",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!reviewText.trim()) {
      toast({
        title: "Input Error",
        description: "Please enter your review.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newReview = {
        id: `r${Date.now()}`,
        author: authorName,
        content: reviewText,
        rating,
        timestamp: new Date().toISOString(),
        photoUrl: imageUrl || undefined,
      };
      
      setReviews((prev) => [newReview, ...prev]);
      setReviewText("");
      setImageUrl("");
      setIsSubmitting(false);
      
      toast({
        title: "Review Submitted",
        description: "Your review has been added successfully!",
      });
    }, 1000);
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Community Reviews</h2>
      
      <form onSubmit={handleSubmitReview} className="glassmorphism rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-2">Share Your Experience</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Rating
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="reviewText" className="block text-sm font-medium mb-1">
            Your Review
          </label>
          <Textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience at this location..."
            rows={4}
          />
        </div>
        
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
            Image URL (Optional)
          </label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/your-astrophoto.jpg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Share a photo you captured at this location
          </p>
        </div>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Post Review
            </>
          )}
        </Button>
      </form>
      
      <Separator />
      
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="space-y-4">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarFallback>
                    {review.author.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{review.author}</h4>
                      <div className="flex items-center mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-foreground/90">{review.content}</p>
                  
                  {review.photoUrl && (
                    <div className="mt-3 relative">
                      <div className="overflow-hidden rounded-md bg-cosmic-800 h-48 md:h-64">
                        <img
                          src={review.photoUrl}
                          alt="User submitted astrophotography"
                          className="object-cover w-full h-full transition-transform hover:scale-105"
                        />
                      </div>
                      <Badge variant="secondary" className="absolute top-2 right-2">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Photo
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="border-cosmic-700" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
