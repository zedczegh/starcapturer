import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Trash2, Download, Loader2, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
  category: string;
}

type Category = 'artworks' | 'work_in_progress' | 'writings';

const PersonalUploader = () => {
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [postCategory, setPostCategory] = useState<Category>('writings');

  useEffect(() => {
    const initializeUploader = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user?.email === "yanzeyucq@163.com") {
        await loadFiles();
      } else {
        setLoading(false);
      }
    };

    initializeUploader();
  }, []);

  useEffect(() => {
    if (user?.email === "yanzeyucq@163.com") {
      loadFiles();
    }
  }, [selectedCategory]);

  const loadFiles = async () => {
    try {
      let query = supabase
        .from("personal_uploads")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum file size is 20MB",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("personal-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from("personal_uploads")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description: description || null,
          category: postCategory,
        });

      if (dbError) throw dbError;

      toast.success("Upload successful", {
        description: "Your file has been uploaded",
      });

      setDescription("");
      loadFiles();
    } catch (error: any) {
      toast.error("Upload failed", {
        description: error.message,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("personal-uploads")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("personal_uploads")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      toast.success("File deleted", {
        description: "Your file has been removed",
      });

      loadFiles();
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message,
      });
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("personal-uploads")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      artworks: "🎨 Artworks",
      work_in_progress: "🚧 Work in Progress",
      writings: "📝 Writings"
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      artworks: "text-pink-400",
      work_in_progress: "text-yellow-400",
      writings: "text-blue-400"
    };
    return colors[category] || "text-cosmic-400";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-5 w-5 text-green-400" />;
    if (fileType === "application/pdf") return <FileText className="h-5 w-5 text-red-400" />;
    if (fileType.includes("word") || fileName.endsWith(".doc") || fileName.endsWith(".docx")) 
      return <FileText className="h-5 w-5 text-blue-400" />;
    if (fileType.includes("presentation") || fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) 
      return <File className="h-5 w-5 text-orange-400" />;
    return <FileText className="h-5 w-5 text-cosmic-400" />;
  };

  if (user?.email !== "yanzeyucq@163.com") {
    return null;
  }

  return (
    <motion.div
      className="mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6 bg-cosmic-900/50 border-cosmic-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-cosmic-50">
            Portfolio & Research
          </h3>
        </div>

        {/* Category Navigation */}
        <div className="flex gap-2 mb-6 border-b border-cosmic-700 pb-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-cosmic-600 text-white'
                : 'text-cosmic-300 hover:text-white hover:bg-cosmic-800/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory('artworks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'artworks'
                ? 'bg-pink-600 text-white'
                : 'text-cosmic-300 hover:text-white hover:bg-cosmic-800/50'
            }`}
          >
            🎨 Artworks
          </button>
          <button
            onClick={() => setSelectedCategory('work_in_progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'work_in_progress'
                ? 'bg-yellow-600 text-white'
                : 'text-cosmic-300 hover:text-white hover:bg-cosmic-800/50'
            }`}
          >
            🚧 WIP
          </button>
          <button
            onClick={() => setSelectedCategory('writings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'writings'
                ? 'bg-blue-600 text-white'
                : 'text-cosmic-300 hover:text-white hover:bg-cosmic-800/50'
            }`}
          >
            📝 Writings
          </button>
        </div>
        
        {/* Create Post Section */}
        <div className="space-y-4 mb-6 p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700">
          <h4 className="text-sm font-medium text-cosmic-200">Create New Post</h4>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPostCategory('artworks')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                postCategory === 'artworks'
                  ? 'bg-pink-600 text-white'
                  : 'bg-cosmic-700 text-cosmic-300 hover:bg-cosmic-600'
              }`}
            >
              🎨 Artworks
            </button>
            <button
              onClick={() => setPostCategory('work_in_progress')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                postCategory === 'work_in_progress'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-cosmic-700 text-cosmic-300 hover:bg-cosmic-600'
              }`}
            >
              🚧 WIP
            </button>
            <button
              onClick={() => setPostCategory('writings')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                postCategory === 'writings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-cosmic-700 text-cosmic-300 hover:bg-cosmic-600'
              }`}
            >
              📝 Writings
            </button>
          </div>

          <div>
            <Label htmlFor="description" className="text-cosmic-200 text-xs">
              Caption / Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-cosmic-800 border-cosmic-700 text-cosmic-50"
            />
          </div>

          <div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded-lg transition-colors w-fit">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{uploading ? "Uploading..." : "Upload File"}</span>
              </div>
            </Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
            />
            <p className="text-xs text-cosmic-400 mt-2">
              Images, PDFs, Word, PowerPoint - Max 20MB
            </p>
          </div>
        </div>

        {/* Posts Feed - 3x3 Grid Layout */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-cosmic-400">
            <p>No posts yet in this category</p>
            <p className="text-sm mt-2">Share your first {selectedCategory === 'all' ? 'post' : selectedCategory.replace('_', ' ')}!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-cosmic-800/30 rounded-lg border border-cosmic-700 overflow-hidden hover:border-cosmic-600 transition-all group"
                >
                  {/* Image or File Preview */}
                  <div className="relative aspect-square bg-cosmic-950">
                    {file.file_type.startsWith("image/") ? (
                      <img 
                        src={getFileUrl(file.file_path)} 
                        alt={file.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                        {getFileIcon(file.file_type, file.file_name)}
                        <div className="text-center">
                          <p className="text-cosmic-50 font-medium text-sm line-clamp-2">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-cosmic-500 mt-1">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getFileUrl(file.file_path), "_blank")}
                        className="bg-cosmic-700/80 hover:bg-cosmic-600 text-white"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.file_path)}
                        className="bg-red-500/80 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xs text-blue-300">
                        ZC
                      </div>
                      <span className={`text-xs font-medium ${getCategoryColor(file.category)}`}>
                        {getCategoryLabel(file.category)}
                      </span>
                    </div>
                    
                    {file.description && (
                      <p className="text-cosmic-300 text-xs line-clamp-2 mb-2">{file.description}</p>
                    )}
                    
                    <p className="text-xs text-cosmic-500">
                      {new Date(file.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PersonalUploader;
