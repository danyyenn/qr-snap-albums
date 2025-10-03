import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Calendar, MapPin, Image as ImageIcon, Trash2, Settings, ArrowDown } from "lucide-react";
import JSZip from "jszip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
  description: string;
  upload_code: string;
  cover_image_url: string;
  host_id: string;
  allow_guest_view: boolean;
  require_approval: boolean;
  is_public_gallery: boolean;
  max_photos: number;
}

interface Photo {
  id: string;
  storage_path: string;
  original_filename: string;
  uploaded_at: string;
  is_approved: boolean;
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        navigate("/404");
        return;
      }

      setEvent(eventData);
      setIsHost(session?.user?.id === eventData.host_id);

      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", id)
        .order("uploaded_at", { ascending: false });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Use the full URL for the guest upload page
  const uploadUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/guest`
    : '/guest';
  
  console.log('QR Code URL:', uploadUrl); // Debug: Check what URL is generated

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.name,
        text: `Upload photos to ${event?.name}`,
        url: uploadUrl,
      });
    } else {
      navigator.clipboard.writeText(uploadUrl);
      toast({
        title: "Link Copied!",
        description: "Upload link copied to clipboard",
      });
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Clone the SVG to avoid modifying the original
    const svgClone = svg.cloneNode(true) as SVGElement;
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Set a fixed size for better quality
    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();

    img.onload = () => {
      if (!ctx) return;
      
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      
      // Draw the QR code
      ctx.drawImage(img, 0, 0, size, size);
      
      // Get the data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Detect if mobile device (iOS Safari doesn't support download attribute)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, open in new window where user can long-press to save
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR Code - ${event?.name || 'Event'}</title>
                <style>
                  body {
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: #f5f5f5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  }
                  .instructions {
                    margin-top: 20px;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    text-align: center;
                    max-width: 400px;
                  }
                  h3 {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                    color: #333;
                  }
                  p {
                    margin: 0;
                    font-size: 14px;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <img src="${dataUrl}" alt="QR Code">
                <div class="instructions">
                  <h3>📱 To Save This QR Code:</h3>
                  <p>Long-press on the image above and select "Save Image" or "Add to Photos"</p>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
        toast({
          title: "QR Code Opened",
          description: "Long-press the image to save it",
        });
      } else {
        // Desktop: use download attribute
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${event?.name}-qr-code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "QR Code Downloaded",
          description: "QR code saved to your device",
        });
      }
    };

    img.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate QR code. Please try again.",
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadAll = async () => {
    if (!event || photos.length === 0) return;

    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event.name);

      for (const photo of photos) {
        try {
          const { data, error } = await supabase.storage
            .from("event-photos")
            .download(photo.storage_path);

          if (error) throw error;
          if (data) {
            folder?.file(photo.original_filename || `photo-${photo.id}.jpg`, data);
          }
        } catch (err) {
          console.error(`Failed to download ${photo.storage_path}:`, err);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.name}-photos.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete!",
        description: `Downloaded ${photos.length} photos`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message,
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPhoto = async (photo: Photo) => {
    try {
      const { data, error } = await supabase.storage
        .from("event-photos")
        .download(photo.storage_path);

      if (error) throw error;
      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement("a");
        link.href = url;
        link.download = photo.original_filename || `photo-${photo.id}.jpg`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Downloaded!",
          description: "Photo downloaded successfully",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message,
      });
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoId) return;

    try {
      const photo = photos.find((p) => p.id === deletePhotoId);
      if (!photo) return;

      const { error: storageError } = await supabase.storage
        .from("event-photos")
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", deletePhotoId);

      if (dbError) throw dbError;

      setPhotos(photos.filter((p) => p.id !== deletePhotoId));
      toast({
        title: "Photo Deleted",
        description: "Photo has been removed",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setDeletePhotoId(null);
    }
  };

  const handleSettingChange = async (field: string, value: boolean) => {
    if (!event) return;

    try {
      const { error } = await supabase
        .from("events")
        .update({ [field]: value })
        .eq("id", event.id);

      if (error) throw error;

      setEvent({ ...event, [field]: value });
      toast({
        title: "Settings Updated",
        description: "Event settings have been saved",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleApprovePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from("photos")
        .update({ is_approved: true })
        .eq("id", photoId);

      if (error) throw error;

      setPhotos(photos.map(p => p.id === photoId ? { ...p, is_approved: true } : p));
      toast({
        title: "Photo Approved",
        description: "Photo is now visible to guests",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleRejectPhoto = async (photoId: string) => {
    setDeletePhotoId(photoId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{event?.name ? `${event.name} - Event Photos` : "Event Photos"} - FlashNShare</title>
        <meta name="description" content={`View and manage photos for ${event?.name || "your event"}. Download QR code, share upload link with guests, and manage your event gallery.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-24">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          {isHost && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Share this QR code with guests</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={uploadUrl} size={200} />
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Code</CardTitle>
              <CardDescription>Guests can use this code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center py-4 bg-muted rounded-lg">
                {event.upload_code}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Event statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photos</span>
                  <span className="font-bold">{photos.filter(p => p.is_approved).length} / {event.max_photos || 1000}</span>
                </div>
                {(() => {
                  const photoCount = photos.length;
                  const maxPhotos = event.max_photos || 1000;
                  const percentFull = (photoCount / maxPhotos) * 100;
                  
                  if (percentFull >= 90) {
                    return (
                      <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive font-medium">
                        ⚠️ Almost full!
                      </div>
                    );
                  } else if (percentFull >= 75) {
                    return (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-600 dark:text-amber-400 font-medium">
                        📸 {Math.round(percentFull)}% full
                      </div>
                    );
                  }
                  return null;
                })()}
                {event.require_approval && isHost && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Pending Approval</span>
                    <span className="font-bold text-amber-600">{photos.filter(p => !p.is_approved).length}</span>
                  </div>
                )}
                {isHost && (
                  <Button
                    onClick={handleDownloadAll}
                    disabled={downloading || photos.filter(p => p.is_approved).length === 0}
                    variant="hero"
                    className="w-full mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? "Downloading..." : "Download All"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {isHost && event.require_approval && photos.filter(p => !p.is_approved).length > 0 && (
          <Card className="mb-8 border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>
                {photos.filter(p => !p.is_approved).length} photo{photos.filter(p => !p.is_approved).length !== 1 ? 's' : ''} waiting for your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.filter(p => !p.is_approved).map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={supabase.storage.from("event-photos").getPublicUrl(photo.storage_path).data.publicUrl}
                      alt={photo.original_filename}
                      className="w-full aspect-square object-cover rounded-lg opacity-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <Button
                        onClick={() => handleApprovePhoto(photo.id)}
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectPhoto(photo.id)}
                        variant="destructive"
                        size="sm"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>
              {photos.filter(p => p.is_approved).length === 0 
                ? "No approved photos yet" 
                : `${photos.filter(p => p.is_approved).length} approved photo${photos.filter(p => p.is_approved).length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photos.filter(p => p.is_approved).length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {event.require_approval 
                    ? "Approve photos from the pending section above to display them here"
                    : "Share the QR code or upload link with guests to start collecting photos"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.filter(p => p.is_approved).map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={supabase.storage.from("event-photos").getPublicUrl(photo.storage_path).data.publicUrl}
                      alt={photo.original_filename}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleDownloadPhoto(photo)}
                        variant="secondary"
                        size="icon"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      {isHost && (
                        <Button
                          onClick={() => setDeletePhotoId(photo.id)}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deletePhotoId} onOpenChange={() => setDeletePhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the photo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Settings</DialogTitle>
            <DialogDescription>
              Configure privacy and viewing options for your event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-guest-view">Allow Guests to View Photos</Label>
                <p className="text-sm text-muted-foreground">
                  Guests can see approved photos after uploading
                </p>
              </div>
              <Switch
                id="allow-guest-view"
                checked={event?.allow_guest_view || false}
                onCheckedChange={(checked) => handleSettingChange("allow_guest_view", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-approval">Require Photo Approval</Label>
                <p className="text-sm text-muted-foreground">
                  You must approve photos before guests can see them
                </p>
              </div>
              <Switch
                id="require-approval"
                checked={event?.require_approval || false}
                onCheckedChange={(checked) => handleSettingChange("require_approval", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-gallery">Public Gallery</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can view photos (no upload code needed)
                </p>
              </div>
              <Switch
                id="public-gallery"
                checked={event?.is_public_gallery || false}
                onCheckedChange={(checked) => handleSettingChange("is_public_gallery", checked)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetail;
