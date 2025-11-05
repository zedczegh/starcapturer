import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Trash2, Download, Loader2, File, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-components";
import { fetchWithCache, clearCacheForUrl } from "@/utils/fetchWithCache";

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
  const [selectedCategory, setSelectedCategory] = useState<Category>('artworks');
  const [postCategory, setPostCategory] = useState<Category>('artworks');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  useEffect(() => {
    const initializeUploader = async () => {
      console.log("Initializing uploader...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session user:", session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user?.email === "yanzeyucq@163.com") {
        console.log("User is authorized, loading files...");
        loadFiles();
      } else {
        console.log("User not authorized");
      }
    };

    initializeUploader();
  }, []);

  useEffect(() => {
    if (user?.email === "yanzeyucq@163.com") {
      loadFiles();
    }
  }, []); // Remove selectedCategory dependency since we load all files now

  const loadFiles = async () => {
    console.log("Loading all files...");
    try {
      const { data, error } = await supabase
        .from("personal_uploads")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Files loaded:", data, "Error:", error);
      
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files", {
        description: error.message || "Unknown error"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Starting file upload:", file.name, file.size);

    // Validate description is not empty
    if (!description.trim()) {
      toast.error("Description required", {
        description: "Please add a caption before uploading",
      });
      event.target.value = "";
      return;
    }

    setUploading(true);
    console.log("Upload started, user:", user?.id);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("Uploading to storage:", filePath);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("personal-uploads")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Storage upload successful, saving to database");

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

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      console.log("Upload complete");

      toast.success("Upload successful", {
        description: "Your file has been uploaded",
      });

      setDescription("");
      setUploadDialogOpen(false);
      await loadFiles();
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error("Upload failed", {
        description: error.message || "Unknown error occurred",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Optimistically update UI
      setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));

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
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message,
      });
      loadFiles(); // Reload on error
    }
  };

  const getFileUrl = (filePath: string, forDownload = false) => {
    // Use Supabase public URL with proper project reference
    const { data } = supabase.storage.from('personal-uploads').getPublicUrl(filePath);
    
    // If download is requested, add download parameter
    if (forDownload && data?.publicUrl) {
      const url = new URL(data.publicUrl);
      url.searchParams.set('download', 'true');
      return url.toString();
    }
    
    return data?.publicUrl || '';
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(getFileUrl(filePath, true));
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Download started", {
        description: "Your file is downloading"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Download failed", {
        description: "Please try again"
      });
    }
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

  // Don't render anything if user is not authorized
  if (loading) {
    console.log("PersonalUploader still loading...");
    return (
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-cosmic-900/50 border-cosmic-700">
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
          </div>
        </Card>
      </motion.div>
    );
  }

  if (user?.email !== "yanzeyucq@163.com") {
    console.log("User not authorized for PersonalUploader:", user?.email);
    return null;
  }

  console.log("Rendering PersonalUploader for authorized user");

  const renderPostsGrid = (category: Category) => {
    const categoryFiles = files.filter(f => f.category === category);
    
    console.log(`Rendering ${category} grid with ${categoryFiles.length} files`);
    
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
        </div>
      );
    }
    
    if (categoryFiles.length === 0) {
      return (
        <div className="text-center py-12 text-cosmic-400">
          <p>No posts yet</p>
          <p className="text-sm mt-2">Share your first {category.replace('_', ' ')}!</p>
        </div>
      );
    }
    
     return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <AnimatePresence>
          {categoryFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-cosmic-950 overflow-hidden group cursor-pointer flex flex-col rounded-lg border border-cosmic-800 hover:border-cosmic-600 transition-all"
              onClick={() => setPreviewFile(file)}
            >
              <div className="aspect-square relative overflow-hidden">
                {file.file_type.startsWith("image/") ? (
                  <OptimizedImage
                    src={getFileUrl(file.file_path)} 
                    alt={file.file_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2 bg-cosmic-900">
                    {getFileIcon(file.file_type, file.file_name)}
                    <p className="text-cosmic-50 text-xs text-center line-clamp-2">
                      {file.file_name}
                    </p>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file.file_path, file.file_name);
                    }}
                    className="bg-cosmic-700/80 hover:bg-cosmic-600 text-white h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id, file.file_path);
                    }}
                    className="bg-red-500/80 hover:bg-red-600 text-white h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Description below image */}
              {file.description && (
                <div className="p-2 bg-cosmic-900/80">
                  <p className="text-cosmic-200 text-xs line-clamp-2">{file.description}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      className="mt-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6 bg-cosmic-900/50 border-cosmic-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-cosmic-50">
            Portfolio & Research
          </h3>
          <Button
            onClick={() => {
              setPostCategory(selectedCategory);
              setUploadDialogOpen(true);
            }}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            size="icon"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Instagram-style Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="artworks" className="text-xs sm:text-sm">
              🎨 Artworks
            </TabsTrigger>
            <TabsTrigger value="work_in_progress" className="text-xs sm:text-sm">
              🚧 WIP
            </TabsTrigger>
            <TabsTrigger value="writings" className="text-xs sm:text-sm">
              📝 Research
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="artworks">
            {renderPostsGrid('artworks')}
          </TabsContent>
          
          <TabsContent value="work_in_progress">
            {renderPostsGrid('work_in_progress')}
          </TabsContent>
          
          <TabsContent value="writings">
            {renderPostsGrid('writings')}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="bg-cosmic-900 border-cosmic-700 max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-cosmic-50">{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          
          {previewFile && (
            <div className="space-y-4">
              {/* Image Preview */}
              {previewFile.file_type.startsWith("image/") && (
                <div className="relative w-full">
                  <OptimizedImage
                    src={getFileUrl(previewFile.file_path)} 
                    alt={previewFile.file_name}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
              
              {/* PDF Preview */}
              {previewFile.file_type === "application/pdf" && (
                <div className="space-y-4">
                  <iframe
                    src={getFileUrl(previewFile.file_path, false)}
                    className="w-full h-[70vh] rounded-lg border border-cosmic-700"
                    title={previewFile.file_name}
                  />
                  <p className="text-xs text-cosmic-400 text-center">
                    Scroll to view all pages • Click download button below to save
                  </p>
                </div>
              )}
              
              {/* Document Preview (Word, etc) */}
              {(previewFile.file_type.includes("word") || 
                previewFile.file_name.endsWith(".doc") || 
                previewFile.file_name.endsWith(".docx")) && (
                <div className="text-center py-12 space-y-4">
                  <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-cosmic-300 mb-2">Microsoft Word Document</p>
                  <p className="text-cosmic-400 text-sm mb-4">Preview not available in browser</p>
                  <Button
                    onClick={() => downloadFile(previewFile.file_path, previewFile.file_name)}
                    className="bg-cosmic-600 hover:bg-cosmic-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
              
              {/* File Info */}
              <div className="border-t border-cosmic-700 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-medium ${getCategoryColor(previewFile.category)}`}>
                    {getCategoryLabel(previewFile.category)}
                  </span>
                </div>
                {previewFile.description && (
                  <p className="text-cosmic-300 text-sm">{previewFile.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-cosmic-500">
                  <span>{formatFileSize(previewFile.file_size)}</span>
                  <span>
                    {new Date(previewFile.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(previewFile.file_path, previewFile.file_name);
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(previewFile.id, previewFile.file_path);
                      setPreviewFile(null);
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-cosmic-900 border-cosmic-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cosmic-50">Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-cosmic-200 text-sm mb-2 block">Category</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPostCategory('artworks')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    postCategory === 'artworks'
                      ? 'bg-pink-600 text-white'
                      : 'bg-cosmic-700 text-cosmic-300 hover:bg-cosmic-600'
                  }`}
                >
                  🎨 Artworks
                </button>
                <button
                  onClick={() => setPostCategory('work_in_progress')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    postCategory === 'work_in_progress'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-cosmic-700 text-cosmic-300 hover:bg-cosmic-600'
                  }`}
                >
                  🚧 WIP
                </button>
                <button
                  onClick={() => setPostCategory('writings')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    postCategory === 'writings'
                      ? 'bg-blue-600 text-white'
                      : 'bg-cosmic-700 text-cosmic-300 hover:bg-cosmic-600'
                  }`}
                >
                  📝 Research
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="dialog-description" className="text-cosmic-200 text-sm">
                Caption / Description <span className="text-red-400">*</span>
              </Label>
              <Input
                id="dialog-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-cosmic-800 border-cosmic-700 text-cosmic-50 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="dialog-file-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded-lg transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span>{uploading ? "Uploading..." : "Select File"}</span>
                </div>
              </Label>
              <Input
                id="dialog-file-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
              <p className="text-xs text-cosmic-400 mt-2 text-center">
                Images, PDFs, Documents - Max 20MB
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PersonalUploader;
