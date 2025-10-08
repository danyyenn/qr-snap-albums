import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Calendar, MapPin, Image as ImageIcon, Trash2, Settings, ArrowDown, Edit2, Check, X, Pencil, Images } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [editingCode, setEditingCode] = useState(false);
  const [newUploadCode, setNewUploadCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [generatingCollage, setGeneratingCollage] = useState(false);
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
      const hostStatus = session?.user?.id === eventData.host_id;
      console.log('Host check:', { userId: session?.user?.id, hostId: eventData.host_id, isHost: hostStatus });
      setIsHost(hostStatus);

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
      
      // Detect iOS specifically
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isIOS) {
        // Convert data URL to blob for iOS sharing
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `${event?.name || 'event'}-qr-code.png`, { type: 'image/png' });
            
            // Use native iOS share sheet
            if (navigator.share) {
              navigator.share({
                files: [file],
                title: `QR Code - ${event?.name || 'Event'}`,
              }).catch((error) => {
                // If share fails, fallback to opening in new tab
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
              });
            } else {
              // Fallback if share API not available
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
            }
          });
      } else {
        // Desktop/Android: use download attribute
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
      
      // iOS-friendly download using Share API
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && navigator.share) {
        try {
          const file = new File([content], `${event.name}-photos.zip`, { type: "application/zip" });
          await navigator.share({
            files: [file],
            title: `${event.name} Photos`,
            text: `${photos.length} photos from ${event.name}`,
          });
          toast({
            title: "Shared Successfully!",
            description: "You can now save the ZIP file",
          });
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            // Fallback to data URL download
            const url = URL.createObjectURL(content);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${event.name}-photos.zip`;
            link.click();
            URL.revokeObjectURL(url);
            toast({
              title: "Download Started",
              description: `Downloading ${photos.length} photos`,
            });
          }
        }
      } else {
        // Desktop/Android: standard download
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
      }
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
        const filename = photo.original_filename || `photo-${photo.id}.jpg`;
        
        // iOS-friendly download using Share API
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS && navigator.share) {
          try {
            const file = new File([data], filename, { type: data.type });
            await navigator.share({
              files: [file],
              title: "Photo from " + event?.name,
            });
            toast({
              title: "Shared!",
              description: "You can now save the photo to your device",
            });
          } catch (shareError: any) {
            if (shareError.name !== 'AbortError') {
              // Fallback to data URL
              const url = URL.createObjectURL(data);
              const link = document.createElement("a");
              link.href = url;
              link.download = filename;
              link.click();
              URL.revokeObjectURL(url);
              toast({
                title: "Downloaded!",
                description: "Photo downloaded successfully",
              });
            }
          }
        } else {
          // Desktop/Android: standard download
          const url = URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "Downloaded!",
            description: "Photo downloaded successfully",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message,
      });
    }
  };

  const handleGenerateCollage = async () => {
    if (!event || photos.length === 0) return;

    setGeneratingCollage(true);
    try {
      const approvedPhotos = photos.filter(p => p.is_approved);
      if (approvedPhotos.length === 0) {
        throw new Error("No approved photos to create collage");
      }

      // Limit to max 24 photos for better visual appeal
      const selectedPhotos = approvedPhotos.slice(0, 24);

      // Load all images
      const imagePromises = selectedPhotos.map(async (photo) => {
        const { data, error } = await supabase.storage
          .from("event-photos")
          .download(photo.storage_path);
        
        if (error) throw error;
        
        const url = URL.createObjectURL(data);
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      });

      const images = await Promise.all(imagePromises);
      
      // Create canvas for collage
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas size with space for title
      canvas.width = 2400;
      canvas.height = 3000;

      // Create gradient background
      // Draw artistic cork board background with gradient
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      );
      bgGradient.addColorStop(0, "#DEC4A1");
      bgGradient.addColorStop(0.5, "#D4B896");
      bgGradient.addColorStop(1, "#C9A876");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add organic cork texture with varied dots and grain
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 0.3;
        const opacity = Math.random() * 0.25 + 0.05;
        const brownTone = Math.random() > 0.5 ? "139, 101, 63" : "115, 85, 55";
        
        ctx.fillStyle = `rgba(${brownTone}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add subtle stains and marks for authenticity
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 120 + 40;
        
        ctx.fillStyle = `rgba(160, 120, 80, ${Math.random() * 0.08 + 0.02})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw title at the top with artistic styling
      const titleHeight = 220;
      ctx.save();
      
      // Draw title text with outline for depth
      ctx.font = "bold 130px 'Pacifico', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Text shadow for depth
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      
      // Main title
      ctx.fillStyle = "#3D2817";
      ctx.fillText(event.name, canvas.width / 2, 150);
      
      ctx.shadowColor = "transparent";
      
      // Subtle outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeText(event.name, canvas.width / 2, 150);
      
      // Draw subtitle with artistic font
      const eventDateStr = new Date(event.event_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      ctx.font = "italic 50px 'Satisfy', cursive";
      ctx.fillStyle = "#5D4E37";
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(eventDateStr, canvas.width / 2, 230);
      
      ctx.restore();

      // Add celebration decorations at the top
      ctx.save();
      
      // Draw confetti pieces around the title
      const confettiColors = ["#FFD700", "#FF6B9D", "#4ECDC4", "#F76B1C", "#9B59B6"];
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * 320;
        const size = Math.random() * 15 + 8;
        const rotation = Math.random() * Math.PI;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 4;
        
        if (Math.random() > 0.5) {
          // Rectangle confetti
          ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        } else {
          // Circle confetti
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
      
      // Draw sparkles/stars
      ctx.shadowColor = "transparent";
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * 300;
        const size = Math.random() * 4 + 2;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${Math.random() * 0.6 + 0.4})`;
        ctx.beginPath();
        // Draw a star shape
        for (let j = 0; j < 5; j++) {
          const angle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
          const radius = j % 2 === 0 ? size : size / 2;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();

      // Draw photos with creative positioning
      const startY = titleHeight + 140;
      const photoWidth = 450;
      const photoHeight = 400;
      
      images.forEach((img, index) => {
        ctx.save();
        
        // Calculate position with varied layout - tighter spacing, centered
        const cols = 4;
        const spacing = 50;
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        // Calculate total width and center the grid
        const totalWidth = cols * photoWidth + (cols - 1) * spacing;
        const startX = (canvas.width - totalWidth) / 2;
        
        // Add some randomness to positioning
        const randomOffsetX = (Math.random() - 0.5) * 50;
        const randomOffsetY = (Math.random() - 0.5) * 50;
        
        const x = startX + col * (photoWidth + spacing) + randomOffsetX;
        const y = startY + row * (photoHeight + spacing) + randomOffsetY;
        
        // Random rotation between -12 and 12 degrees
        const rotation = (Math.random() - 0.5) * 0.25;
        
        // Move to center of photo for rotation
        ctx.translate(x + photoWidth / 2, y + photoHeight / 2);
        ctx.rotate(rotation);
        
        // Enhanced 3D shadow - multiple layers for depth
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 12;
        ctx.shadowOffsetY = 12;
        
        // Draw white border (polaroid effect)
        ctx.fillStyle = "white";
        ctx.fillRect(-photoWidth / 2 - 15, -photoHeight / 2 - 15, photoWidth + 30, photoHeight + 60);
        
        ctx.shadowColor = "transparent";
        
        // Draw pin at the top
        const pinX = 0;
        const pinY = -photoHeight / 2 - 25;
        
        // Pin shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        
        // Pin head (circular part)
        ctx.fillStyle = "#e74c3c"; // Red pin head
        ctx.beginPath();
        ctx.arc(pinX, pinY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Pin highlight for 3D effect
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(pinX - 3, pinY - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pin needle (metallic part going into photo)
        ctx.fillStyle = "#95a5a6";
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 3;
        ctx.fillRect(pinX - 1.5, pinY + 8, 3, 15);
        
        ctx.shadowColor = "transparent";
        
        // Draw the photo
        const scale = Math.max(photoWidth / img.width, photoHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (photoWidth - scaledWidth) / 2;
        const offsetY = (photoHeight - scaledHeight) / 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(-photoWidth / 2, -photoHeight / 2, photoWidth, photoHeight);
        ctx.clip();
        ctx.drawImage(
          img,
          -photoWidth / 2 + offsetX,
          -photoHeight / 2 + offsetY,
          scaledWidth,
          scaledHeight
        );
        ctx.restore();
        
        ctx.restore();
      });

      // Convert to blob and download
      canvas.toBlob(async (blob) => {
        if (blob) {
          const filename = `${event.name}-collage.png`;
          
          // iOS-friendly download using Share API
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS && navigator.share) {
            try {
              const file = new File([blob], filename, { type: "image/png" });
              await navigator.share({
                files: [file],
                title: `${event.name} Collage`,
                text: "Photo collage from " + event.name,
              });
              toast({
                title: "Collage Shared!",
                description: "You can now save the collage to your Photos",
              });
            } catch (shareError: any) {
              if (shareError.name !== 'AbortError') {
                // Fallback to data URL
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
                toast({
                  title: "Collage Downloaded!",
                  description: "Your artistic photo collage has been saved",
                });
              }
            }
          } else {
            // Desktop/Android: standard download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            
            toast({
              title: "Stylish Collage Created!",
              description: "Your artistic photo collage has been downloaded",
            });
          }
        }
      }, "image/png");

      // Clean up image URLs
      images.forEach(img => URL.revokeObjectURL(img.src));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Collage Generation Failed",
        description: error.message,
      });
    } finally {
      setGeneratingCollage(false);
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

  const validateUploadCode = (code: string) => {
    const regex = /^[a-zA-Z0-9]{4,6}$/;
    return regex.test(code);
  };

  const handleEditCode = () => {
    setNewUploadCode(event?.upload_code || "");
    setEditingCode(true);
  };

  const handleCancelEditCode = () => {
    setEditingCode(false);
    setNewUploadCode("");
  };

  const handleSaveCode = async () => {
    if (!event || !newUploadCode) return;

    const trimmedCode = newUploadCode.trim().toUpperCase();
    
    if (!validateUploadCode(trimmedCode)) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Upload code must be 4-6 alphanumeric characters",
      });
      return;
    }

    if (trimmedCode === event.upload_code) {
      setEditingCode(false);
      return;
    }

    setSavingCode(true);
    try {
      // Check if code is unique
      const { data: existingEvent } = await supabase
        .from("events")
        .select("id")
        .eq("upload_code", trimmedCode)
        .neq("id", event.id)
        .maybeSingle();

      if (existingEvent) {
        throw new Error("This upload code is already in use");
      }

      const { error } = await supabase
        .from("events")
        .update({ upload_code: trimmedCode })
        .eq("id", event.id);

      if (error) throw error;

      setEvent({ ...event, upload_code: trimmedCode });
      setEditingCode(false);
      toast({
        title: "Code Updated",
        description: "Upload code has been changed successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSavingCode(false);
    }
  };

  const handleEditDetails = () => {
    setEditedEvent({
      name: event.name,
      event_date: event.event_date,
      location: event.location,
      description: event.description,
    });
    setEditDetailsOpen(true);
  };

  const handleSaveDetails = async () => {
    if (!editedEvent.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Event name is required",
      });
      return;
    }

    if (!editedEvent.event_date) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Event date is required",
      });
      return;
    }

    setSavingDetails(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          name: editedEvent.name,
          event_date: editedEvent.event_date,
          location: editedEvent.location || "",
          description: editedEvent.description || "",
        })
        .eq("id", event.id);

      if (error) throw error;

      setEvent({
        ...event,
        name: editedEvent.name,
        event_date: editedEvent.event_date,
        location: editedEvent.location || "",
        description: editedEvent.description || "",
      });
      setEditDetailsOpen(false);
      toast({
        title: "Event Updated",
        description: "Event details have been saved successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSavingDetails(false);
    }
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
        <title>{event?.name ? `${event.name} - Event Photos` : "Event Photos"} - Flash N Share</title>
        <meta name="description" content={`View and manage photos for ${event?.name || "your event"}. Download QR code, share upload link with guests, and manage your event gallery.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-24 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0 flex-1">
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary mb-2 inline-block text-sm">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">{event.name}</h1>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}</span>
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words">{event.location}</span>
                </span>
              )}
            </div>
          </div>
          {isHost && (
            <div className="flex gap-2 sm:flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleEditDetails} className="w-full sm:w-auto">
                <Pencil className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Edit Details</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="w-full sm:w-auto">
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Settings</span>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Share this QR code with guests</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={uploadUrl} size={180} className="w-full h-auto max-w-[200px]" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="truncate">Download</span>
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  <span className="truncate">Share</span>
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
              {editingCode ? (
                <div className="space-y-3">
                  <Input
                    value={newUploadCode}
                    onChange={(e) => setNewUploadCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-xl sm:text-2xl font-bold text-center uppercase"
                    placeholder="Enter code"
                    disabled={savingCode}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    4-6 characters, letters and numbers only
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveCode}
                      disabled={savingCode}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {savingCode ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancelEditCode}
                      disabled={savingCode}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl font-bold text-center py-4 bg-muted rounded-lg break-all">
                    {event.upload_code}
                  </div>
                  {isHost && (
                    <Button
                      onClick={handleEditCode}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Code
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Event statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground text-sm sm:text-base">Photos</span>
                  <span className="font-bold text-sm sm:text-base">{photos.filter(p => p.is_approved).length} / {event.max_photos || 1000}</span>
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
                  <div className="flex justify-between items-center gap-2 pt-2 border-t">
                    <span className="text-muted-foreground text-sm sm:text-base">Pending Approval</span>
                    <span className="font-bold text-amber-600 text-sm sm:text-base">{photos.filter(p => !p.is_approved).length}</span>
                  </div>
                )}
                {isHost ? (
                  <div className="space-y-2">
                    <Button
                      onClick={handleDownloadAll}
                      disabled={downloading || photos.filter(p => p.is_approved).length === 0}
                      variant="hero"
                      className="w-full mt-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {downloading ? "Downloading..." : "Download All"}
                    </Button>
                    <Button
                      onClick={handleGenerateCollage}
                      disabled={generatingCollage || photos.filter(p => p.is_approved).length === 0}
                      variant="default"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    >
                      <Images className="w-4 h-4 mr-2" />
                      {generatingCollage ? "Creating Magic..." : "✨ Generate Collage"}
                    </Button>
                  </div>
                ) : null}
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

      <Dialog open={editDetailsOpen} onOpenChange={setEditDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event Details</DialogTitle>
            <DialogDescription>
              Update your event information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name *</Label>
              <Input
                id="event-name"
                value={editedEvent.name || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
                placeholder="Event name"
                disabled={savingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date *</Label>
              <Input
                id="event-date"
                type="date"
                value={editedEvent.event_date || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, event_date: e.target.value })}
                disabled={savingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={editedEvent.location || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                placeholder="Event location"
                disabled={savingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={editedEvent.description || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                placeholder="Event description"
                disabled={savingDetails}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveDetails}
                disabled={savingDetails}
                className="flex-1"
              >
                {savingDetails ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={() => setEditDetailsOpen(false)}
                disabled={savingDetails}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetail;
