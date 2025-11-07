import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Trash2, Download, Loader2, File, Plus, Folder, FolderOpen, ChevronRight, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-components";
import { fetchWithCache, clearCacheForUrl } from "@/utils/fetchWithCache";
import { Textarea } from "@/components/ui/textarea";

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
  category: string;
  folder_path?: string | null;
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
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [folderName, setFolderName] = useState('');
  const [isLiked, setIsLiked] = useState(false);

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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log("Starting file upload:", files.length, "files");

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
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const folderPath = postCategory === 'writings' && currentFolder 
          ? `${user.id}/${currentFolder}/${fileName}`
          : `${user.id}/${fileName}`;

        console.log("Uploading to storage:", folderPath);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("personal-uploads")
          .upload(folderPath, file);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        // Save metadata to database
        const { error: dbError } = await supabase
          .from("personal_uploads")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: folderPath,
            file_type: file.type,
            file_size: file.size,
            description: description || null,
            category: postCategory,
            folder_path: postCategory === 'writings' && currentFolder ? currentFolder : null,
          });

        if (dbError) {
          console.error("Database insert error:", dbError);
          throw dbError;
        }
      });

      await Promise.all(uploadPromises);

      console.log("Upload complete");

      toast.success("Upload successful", {
        description: `${files.length} file(s) uploaded`,
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

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log("Starting folder upload:", files.length, "files");

    if (!description.trim()) {
      toast.error("Description required");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Extract folder name from webkitRelativePath
        const relativePath = (file as any).webkitRelativePath || file.name;
        const folderName = relativePath.split('/')[0];
        const filePath = `${user.id}/${folderName}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("personal-uploads")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from("personal_uploads")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            description: description || null,
            category: 'writings',
            folder_path: folderName,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast.success("Folder uploaded", {
        description: `${files.length} file(s) uploaded`,
      });

      setDescription("");
      setUploadDialogOpen(false);
      await loadFiles();
    } catch (error: any) {
      console.error("Folder upload failed:", error);
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

  const getFolders = (category: Category) => {
    const categoryFiles = files.filter(f => f.category === category && f.folder_path);
    const folders = new Set(categoryFiles.map(f => f.folder_path).filter(Boolean));
    return Array.from(folders) as string[];
  };

  const renderPostsGrid = (category: Category) => {
    // Filter files by category
    const categoryFiles = files.filter(f => {
      if (!f.category) return false;
      if (f.category !== category) return false;
      
      // For research section, respect current folder
      if (category === 'writings' && currentFolder) {
        return f.folder_path === currentFolder;
      }
      
      // For research section root, only show files without folder or in no folder
      if (category === 'writings' && !currentFolder) {
        return !f.folder_path;
      }
      
      return true;
    });

    const folders = category === 'writings' && !currentFolder ? getFolders(category) : [];
    
    console.log(`Rendering ${category} grid with ${categoryFiles.length} files out of ${files.length} total`);
    
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
        </div>
      );
    }
    
    if (categoryFiles.length === 0 && folders.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 text-cosmic-400"
        >
          <div className="mb-4">
            {category === 'artworks' && '🎨'}
            {category === 'work_in_progress' && '🚧'}
            {category === 'writings' && '📝'}
          </div>
          <p className="text-lg font-medium text-cosmic-300">No posts yet</p>
          <p className="text-sm mt-2">Share your first {category.replace('_', ' ')}!</p>
        </motion.div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Breadcrumb for folders */}
        {category === 'writings' && currentFolder && (
          <div className="flex items-center gap-2 text-sm text-cosmic-300 pb-2 border-b border-cosmic-800">
            <button 
              onClick={() => setCurrentFolder('')}
              className="hover:text-cosmic-100 transition-colors"
            >
              Research
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-cosmic-100">{currentFolder}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {/* Render folders first (only in research root) */}
          {category === 'writings' && !currentFolder && folders.map((folder) => (
            <motion.div
              key={folder}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentFolder(folder)}
              className="aspect-square relative overflow-hidden group cursor-pointer rounded-sm border border-cosmic-700 bg-gradient-to-br from-cosmic-800 to-cosmic-900 hover:border-cosmic-500 transition-all"
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <FolderOpen className="h-12 w-12 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-cosmic-100 text-xs text-center font-medium line-clamp-2">
                  {folder}
                </p>
                <p className="text-cosmic-500 text-[10px] mt-1">
                  {files.filter(f => f.folder_path === folder).length} files
                </p>
              </div>
            </motion.div>
          ))}

          {/* Render files */}
          <AnimatePresence mode="popLayout">
            {categoryFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group cursor-pointer rounded-sm border border-cosmic-800 hover:border-cosmic-600 transition-all bg-black"
                onClick={() => setPreviewFile(file)}
              >
                <div className="aspect-square relative overflow-hidden">
                  {file.file_type.startsWith("image/") ? (
                    <OptimizedImage
                      src={getFileUrl(file.file_path)} 
                      alt={file.file_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 bg-gradient-to-br from-cosmic-900 to-cosmic-950">
                      {getFileIcon(file.file_type, file.file_name)}
                      <p className="text-cosmic-50 text-[10px] text-center line-clamp-2 font-medium">
                        {file.file_name}
                      </p>
                    </div>
                  )}
                  
                  {/* Hover overlay with actions */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between p-2 transition-opacity"
                  >
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file.file_path, file.file_name);
                        }}
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-7 w-7 p-0 rounded-full"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id, file.file_path);
                        }}
                        className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600 text-white h-7 w-7 p-0 rounded-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
      <Card className="p-0 bg-cosmic-900/30 border-cosmic-800 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cosmic-800">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Portfolio & Research
          </h3>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => {
                setPostCategory(selectedCategory);
                setCurrentFolder('');
                setUploadDialogOpen(true);
              }}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25"
              size="icon"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Instagram-style Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => {
          setSelectedCategory(v as Category);
          setCurrentFolder('');
        }} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-cosmic-800 rounded-none h-auto p-0">
            <TabsTrigger 
              value="artworks" 
              className="text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent py-3"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base">🎨</span>
                <span className="hidden sm:inline">Artworks</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="work_in_progress" 
              className="text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent py-3"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base">🚧</span>
                <span className="hidden sm:inline">WIP</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="writings" 
              className="text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-3"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base">📝</span>
                <span className="hidden sm:inline">Research</span>
              </span>
            </TabsTrigger>
          </TabsList>
          
          <div className="p-2 sm:p-4">
            <TabsContent value="artworks" className="mt-0">
              {renderPostsGrid('artworks')}
            </TabsContent>
            
            <TabsContent value="work_in_progress" className="mt-0">
              {renderPostsGrid('work_in_progress')}
            </TabsContent>
            
            <TabsContent value="writings" className="mt-0">
              {renderPostsGrid('writings')}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Instagram-style Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => {
        setPreviewFile(null);
        setIsLiked(false);
      }}>
        <DialogContent className="bg-black border-none max-w-5xl max-h-[95vh] p-0 overflow-hidden">
          {previewFile && (
            <div className="grid md:grid-cols-[1fr,400px] h-[95vh]">
              {/* Left: Media Preview */}
              <div className="relative bg-black flex items-center justify-center p-4">
                {previewFile.file_type.startsWith("image/") && (
                  <OptimizedImage
                    src={getFileUrl(previewFile.file_path)} 
                    alt={previewFile.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                
                {previewFile.file_type === "application/pdf" && (
                  <iframe
                    src={getFileUrl(previewFile.file_path, false)}
                    className="w-full h-full"
                    title={previewFile.file_name}
                  />
                )}
                
                {(previewFile.file_type.includes("word") || 
                  previewFile.file_name.endsWith(".doc") || 
                  previewFile.file_name.endsWith(".docx")) && (
                  <div className="text-center space-y-4">
                    <FileText className="h-20 w-20 text-blue-400 mx-auto" />
                    <p className="text-white text-lg">Document Preview</p>
                    <Button
                      onClick={() => downloadFile(previewFile.file_path, previewFile.file_name)}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>

              {/* Right: Details & Actions */}
              <div className="bg-cosmic-950 flex flex-col border-l border-cosmic-800">
                {/* Header */}
                <div className="p-4 border-b border-cosmic-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-cosmic-100">{user?.email?.split('@')[0]}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-cosmic-400 hover:text-cosmic-100">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                {/* Caption & Details */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {previewFile.description && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {user?.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-cosmic-100 text-sm">
                          <span className="font-semibold mr-2">{user?.email?.split('@')[0]}</span>
                          {previewFile.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-cosmic-800">
                    <div className="flex items-center justify-between text-xs text-cosmic-400">
                      <span className={`font-medium ${getCategoryColor(previewFile.category)}`}>
                        {getCategoryLabel(previewFile.category)}
                      </span>
                      {previewFile.folder_path && (
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {previewFile.folder_path}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-cosmic-500">
                      <span>{formatFileSize(previewFile.file_size)}</span>
                      <span>•</span>
                      <span>
                        {new Date(previewFile.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="border-t border-cosmic-800">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsLiked(!isLiked)}
                        className="text-cosmic-300 hover:text-cosmic-100 transition-colors"
                      >
                        <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </motion.button>
                      <button className="text-cosmic-300 hover:text-cosmic-100 transition-colors">
                        <MessageCircle className="h-6 w-6" />
                      </button>
                      <button className="text-cosmic-300 hover:text-cosmic-100 transition-colors">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                    <button className="text-cosmic-300 hover:text-cosmic-100 transition-colors">
                      <Bookmark className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="flex gap-2 p-4 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(previewFile.file_path, previewFile.file_name)}
                      className="flex-1 bg-cosmic-800 border-cosmic-700 hover:bg-cosmic-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-cosmic-900 border-cosmic-700 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-cosmic-50 text-xl">Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            <div>
              <Label className="text-cosmic-200 text-sm mb-3 block font-medium">Category</Label>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPostCategory('artworks')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    postCategory === 'artworks'
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-cosmic-800 text-cosmic-300 hover:bg-cosmic-700 border border-cosmic-700'
                  }`}
                >
                  🎨 Artworks
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPostCategory('work_in_progress')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    postCategory === 'work_in_progress'
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25'
                      : 'bg-cosmic-800 text-cosmic-300 hover:bg-cosmic-700 border border-cosmic-700'
                  }`}
                >
                  🚧 WIP
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPostCategory('writings')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    postCategory === 'writings'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-cosmic-800 text-cosmic-300 hover:bg-cosmic-700 border border-cosmic-700'
                  }`}
                >
                  📝 Research
                </motion.button>
              </div>
            </div>

            {/* Folder selection for research */}
            {postCategory === 'writings' && (
              <div>
                <Label className="text-cosmic-200 text-sm mb-2 block font-medium">
                  Folder (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={currentFolder}
                    onChange={(e) => setCurrentFolder(e.target.value)}
                    placeholder="Enter folder name or leave empty"
                    className="bg-cosmic-800 border-cosmic-700 text-cosmic-50"
                  />
                </div>
                {getFolders('writings').length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getFolders('writings').map(folder => (
                      <button
                        key={folder}
                        onClick={() => setCurrentFolder(folder)}
                        className="text-xs px-2 py-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-cosmic-300 border border-cosmic-700"
                      >
                        <Folder className="h-3 w-3 inline mr-1" />
                        {folder}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="dialog-description" className="text-cosmic-200 text-sm font-medium">
                Caption <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="dialog-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a caption..."
                className="bg-cosmic-800 border-cosmic-700 text-cosmic-50 mt-2 min-h-[80px] resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              {postCategory === 'writings' && (
                <Label htmlFor="folder-upload" className="cursor-pointer">
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors shadow-lg"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Folder className="h-5 w-5" />
                    )}
                    <span className="font-medium">{uploading ? "Uploading..." : "Upload Folder"}</span>
                  </motion.div>
                </Label>
              )}
              <Input
                id="folder-upload"
                type="file"
                onChange={handleFolderUpload}
                disabled={uploading}
                className="hidden"
                {...({ webkitdirectory: "", directory: "" } as any)}
                multiple
              />

              <Label htmlFor="dialog-file-upload" className="cursor-pointer">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-colors shadow-lg"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span className="font-medium">{uploading ? "Uploading..." : "Select Files"}</span>
                </motion.div>
              </Label>
              <Input
                id="dialog-file-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                multiple
              />
              <p className="text-xs text-cosmic-400 text-center">
                Images, PDFs, Documents • Max 20MB per file
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PersonalUploader;
