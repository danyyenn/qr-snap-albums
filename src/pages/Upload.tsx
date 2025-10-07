import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Image as ImageIcon, Check, X } from "lucide-react";

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
  description: string;
  allow_guest_view: boolean;
  require_approval: boolean;
  max_photos: number;
}

interface Photo {
  id: string;
  storage_path: string;
  original_filename: string;
  uploaded_at: string;
  is_approved: boolean;
}

interface UploadFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
}

const Upload = () => {
  const { uploadCode } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [guestUploadedPhotos, setGuestUploadedPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    loadEvent();
  }, [uploadCode]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .rpc("get_event_by_upload_code", { p_upload_code: uploadCode });

      if (error || !data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "This upload code doesn't exist or has expired",
        });
        return;
      }

      const eventData = data[0];
      
      // Check photo count vs limit
      const { count } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventData.id);

      if (count && count >= (eventData.max_photos || 1000)) {
        toast({
          variant: "destructive",
          title: "Event Full",
          description: "This event has reached its photo limit",
        });
        setLoading(false);
        return;
      }

      setEvent(eventData);
      
      // Load photos if guest viewing is allowed
      loadPhotos(eventData.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (eventId: string) => {
    try {
      // Load approved photos
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_approved", true)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);

      // Load guest's uploaded photos (even if not approved)
      const guestPhotoIds = getGuestPhotoIds(eventId);
      if (guestPhotoIds.length > 0) {
        const { data: guestPhotos, error: guestError } = await supabase
          .from("photos")
          .select("*")
          .in("id", guestPhotoIds)
          .order("uploaded_at", { ascending: false });

        if (!guestError && guestPhotos) {
          setGuestUploadedPhotos(guestPhotos);
        }
      }
    } catch (error: any) {
      console.error("Error loading photos:", error);
    }
  };

  const getGuestPhotoIds = (eventId: string): string[] => {
    try {
      const stored = localStorage.getItem(`guest_photos_${eventId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveGuestPhotoId = (eventId: string, photoId: string) => {
    try {
      const existing = getGuestPhotoIds(eventId);
      const updated = [...existing, photoId];
      localStorage.setItem(`guest_photos_${eventId}`, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving photo ID:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));

    const newFiles: UploadFile[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const uploadFiles = async () => {
    if (!event || files.length === 0) return;

    // Check photo limit before uploading
    const { count: currentCount } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    const remainingSlots = (event.max_photos || 1000) - (currentCount || 0);
    
    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Upload Limit Reached",
        description: "This event has reached its maximum photo limit",
      });
      return;
    }

    if (files.length > remainingSlots) {
      toast({
        variant: "destructive",
        title: "Too Many Photos",
        description: `You can only upload ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}`,
      });
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status === "success") continue;

      try {
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "uploading" };
          return updated;
        });

        const fileExt = uploadFile.file.name.split(".").pop();
        const fileName = `${event.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("event-photos")
          .upload(fileName, uploadFile.file);

        if (uploadError) throw uploadError;

        const { data: photoData, error: dbError } = await supabase
          .from("photos")
          .insert({
            event_id: event.id,
            storage_path: fileName,
            original_filename: uploadFile.file.name,
            file_size: uploadFile.file.size,
            is_approved: !event.require_approval, // Auto-approve if not required
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Save photo ID to localStorage for guest
        if (photoData?.id) {
          saveGuestPhotoId(event.id, photoData.id);
        }

        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "success" };
          return updated;
        });
      } catch (error: any) {
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "error" };
          return updated;
        });
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: `Failed to upload ${uploadFile.file.name}`,
        });
      }
    }

    setUploading(false);

    const successCount = files.filter((f) => f.status === "success").length;
    if (successCount > 0) {
      const description = event.require_approval
        ? `Successfully uploaded ${successCount} photo${successCount > 1 ? "s" : ""}. Waiting for host approval.`
        : `Successfully uploaded ${successCount} photo${successCount > 1 ? "s" : ""}`;
      
      toast({
        title: "Upload Complete!",
        description,
      });
      
      // Clear uploaded files and reload photos
      setFiles([]);
      if (event) {
        loadPhotos(event.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Header />
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle>Invalid Upload Code</CardTitle>
            <CardDescription>This upload link is not valid or has expired</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{event?.name ? `Upload to ${event.name}` : "Upload Photos"} - Flash N Share</title>
        <meta name="description" content={`Upload your photos to ${event?.name || "this event"}. Share your party and event photos instantly with the host.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
          <p className="text-muted-foreground">
            {new Date(event.event_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {event.description && <p className="text-muted-foreground mt-2">{event.description}</p>}
          
          {(() => {
            const photoCount = photos.length;
            const maxPhotos = event.max_photos || 1000;
            const percentFull = (photoCount / maxPhotos) * 100;
            
            if (percentFull >= 90) {
              return (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Almost full: {photoCount} / {maxPhotos} photos
                  </p>
                </div>
              );
            } else if (percentFull >= 75) {
              return (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    📸 {photoCount} / {maxPhotos} photos uploaded
                  </p>
                </div>
              );
            }
            return null;
          })()}
          
          {event.require_approval && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                📋 Photos require host approval before appearing in the gallery
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Your Photos</CardTitle>
            <CardDescription>Select photos from your device to share with the event host</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Click to select photos</p>
                <p className="text-sm text-muted-foreground">Or drag and drop your photos here</p>
              </label>
            </div>

            {files.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((uploadFile, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={uploadFile.preview}
                        alt="Preview"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      {uploadFile.status === "pending" && !uploading && (
                        <Button
                          onClick={() => removeFile(index)}
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {uploadFile.status === "uploading" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                      {uploadFile.status === "success" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-green-500 rounded-full p-2">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      {uploadFile.status === "error" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-red-500 rounded-full p-2">
                            <X className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={uploadFiles}
                  disabled={uploading || files.every((f) => f.status === "success")}
                  variant="hero"
                  className="w-full"
                  size="lg"
                >
                  {uploading ? "Uploading..." : "Upload Photos"}
                </Button>
              </>
            )}

            {files.length === 0 && (
              <div className="text-center py-8">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No photos selected yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {guestUploadedPhotos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Uploaded Photos</CardTitle>
              <CardDescription>
                {guestUploadedPhotos.length} photo{guestUploadedPhotos.length !== 1 ? "s" : ""} you've uploaded
                {event.require_approval && guestUploadedPhotos.some(p => !p.is_approved) && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    • Photos pending approval will appear in the gallery once approved by the host
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {guestUploadedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={supabase.storage.from("event-photos").getPublicUrl(photo.storage_path).data.publicUrl}
                      alt={photo.original_filename}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {!photo.is_approved && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                        Pending
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {event.allow_guest_view && photos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Event Gallery</CardTitle>
              <CardDescription>
                {photos.length} approved photo{photos.length !== 1 ? "s" : ""} from all guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={supabase.storage.from("event-photos").getPublicUrl(photo.storage_path).data.publicUrl}
                      alt={photo.original_filename}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Upload;
