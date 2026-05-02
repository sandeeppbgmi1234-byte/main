import {
  ImageIcon,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Type,
  Link as LinkIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { AutomationInput } from "./AutomationInput";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DmLink } from "@dm-broo/common-types";
import { SEND_DM_CONFIG } from "@/configs/automations.config";

type Props = {
  message: string;
  onMessageChange: (msg: string) => void;
  imageUrl?: string;
  onImageChange?: (url: string) => void;
  links?: DmLink[];
  onLinksChange?: (links: DmLink[]) => void;
  onIsUploadingChange?: (isUploading: boolean) => void;
};

const SendDm = ({
  message,
  onMessageChange,
  imageUrl,
  onImageChange,
  links = [],
  onLinksChange,
  onIsUploadingChange,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep parent in sync with internal upload state
  useEffect(() => {
    onIsUploadingChange?.(isUploading);
  }, [isUploading, onIsUploadingChange]);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (res?.[0]) {
        onImageChange?.(res[0].url);
        if (message.length > SEND_DM_CONFIG.MAX_CHARS_WITH_IMAGE) {
          onMessageChange(
            message.slice(0, SEND_DM_CONFIG.MAX_CHARS_WITH_IMAGE),
          );
          toast.warning(
            `Message truncated to ${SEND_DM_CONFIG.MAX_CHARS_WITH_IMAGE} characters to fit image DM limit.`,
          );
        } else {
          toast.success("Image uploaded successfully");
        }
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false);
      toast.error(`Upload failed: ${error.message}`);
    },
    onUploadBegin: () => setIsUploading(true),
  });

  // Handle file selection from the hidden input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    await startUpload([file]);
  };

  const removeMedia = () => {
    onImageChange?.("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle files dropped into the upload area
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file.");
      return;
    }
    await startUpload([file]);
  };

  const openAddLink = () => {
    setEditingIndex(null);
    setTitle("");
    setUrl("");
    setIsDialogOpen(true);
  };

  const openEditLink = (index: number) => {
    setEditingIndex(index);
    setTitle(links[index].title);
    setUrl(links[index].url);
    setIsDialogOpen(true);
  };

  const saveLink = () => {
    if (!onLinksChange) {
      toast.error("Error: Unable to update links. Please try again.");
      return;
    }
    if (!title || !url) {
      toast.error("Please fill in both title and URL.");
      return;
    }
    if (editingIndex === null && links.length >= SEND_DM_CONFIG.MAX_LINKS) {
      toast.error(`Maximum ${SEND_DM_CONFIG.MAX_LINKS} links reached.`);
      return;
    }
    if (url.toLowerCase().startsWith("http://")) {
      toast.error("Please use a secure HTTPS link (https://)");
      return;
    }
    const urlRegex = /^(https?:\/\/)?([\w.-]+\.[a-z]{2,})(\/.*)?$/i;
    if (!urlRegex.test(url)) {
      toast.error("Please enter a valid web URL.");
      return;
    }
    const formattedUrl = url.toLowerCase().startsWith("https://")
      ? url
      : `https://${url}`;
    const newLink: DmLink = { title, url: formattedUrl };

    if (editingIndex !== null) {
      const newLinks = [...links];
      newLinks[editingIndex] = newLink;
      onLinksChange(newLinks);
      toast.success("Link updated successfully!");
    } else {
      onLinksChange([...links, newLink]);
      toast.success("Link added successfully!");
    }

    setTitle("");
    setUrl("");
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const removeLink = (index: number) => {
    if (!onLinksChange) {
      toast.error("Error: Unable to remove link. Please try again.");
      return;
    }
    onLinksChange(links.filter((_, i) => i !== index));
    toast.success("Link removed");
  };

  return (
    <div className="bg-white rounded-lg border border-purple-300 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-semibold text-slate-800">Send a DM</span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Media upload area */}
          <div>
            {!imageUrl && !isUploading ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-center gap-2 border border-dashed border-purple-300 rounded-lg py-3 cursor-pointer hover:bg-purple-50 transition-colors"
              >
                <ImageIcon size={16} className="text-slate-400" />
                <span className="text-sm text-slate-400">
                  Select/Drop an image
                </span>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-purple-300 rounded-lg py-6 bg-purple-50/50">
                <Loader2 size={24} className="text-purple-500 animate-spin" />
                <span className="text-sm text-purple-600 font-medium">
                  Uploading image...
                </span>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-purple-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full max-h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <AutomationInput
            value={message}
            onChange={onMessageChange}
            maxLength={
              imageUrl
                ? SEND_DM_CONFIG.MAX_CHARS_WITH_IMAGE
                : SEND_DM_CONFIG.MAX_CHARS_WITHOUT_IMAGE
            }
            placeholder="Enter your message here..."
          />

          {/* Links list */}
          {links.length > 0 && (
            <div className="space-y-2 pt-1">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-[#F8F9FA] px-4 py-3 rounded-2xl border border-slate-100 group hover:border-purple-200 hover:bg-white transition-all active:scale-[0.99]"
                >
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <LinkIcon size={16} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-slate-700 truncate">
                    {link.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openEditLink(index)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit link dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {links.length < SEND_DM_CONFIG.MAX_LINKS && (
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant={"ghost"}
                  onClick={openAddLink}
                  className="w-full flex items-center gap-2 bg-[#F7F0FF] text-[#6A06E4] hover:bg-[#F2E6FF] transition-colors py-5"
                >
                  <span className="text-xs font-normal">Add Link</span>
                </Button>
              </DialogTrigger>
            )}

            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] rounded-2xl sm:rounded-3xl pb-5 sm:pb-6 px-4 sm:px-6">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800">
                  {editingIndex !== null ? "Edit Link" : "Add Link"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 sm:space-y-4 pt-2">
                <div className="rounded-lg sm:rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50 bg-slate-50/50">
                  {/* Title Row */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 bg-white group transition-colors hover:bg-slate-50">
                    <div className="text-slate-400 group-hover:text-purple-500 transition-colors mt-0.5 sm:mt-0 shrink-0">
                      <Type size={17} />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-slate-400 sm:min-w-20">
                        Enter Title
                      </span>
                      <AutomationInput
                        variant="mini"
                        type="input"
                        placeholder="Open Link"
                        value={title}
                        onChange={setTitle}
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>

                  {/* URL Row */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 bg-white group transition-colors hover:bg-slate-50">
                    <div className="text-slate-400 group-hover:text-purple-500 transition-colors mt-0.5 sm:mt-0 shrink-0">
                      <LinkIcon size={17} />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-slate-400 sm:min-w-20">
                        Enter Link
                      </span>
                      <input
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-800 font-medium placeholder:text-slate-300 outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={saveLink}
                  disabled={
                    editingIndex === null &&
                    links.length >= SEND_DM_CONFIG.MAX_LINKS
                  }
                  className="w-full bg-[#6A06E4] hover:bg-[#5805BD] text-white rounded-lg py-5 sm:py-6 font-bold text-sm sm:text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingIndex !== null ? "Update Link" : "Add Link"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {links.length >= SEND_DM_CONFIG.MAX_LINKS && (
            <p className="text-[10px] text-center text-slate-400 pt-1">
              Maximum {SEND_DM_CONFIG.MAX_LINKS} links reached.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SendDm;
