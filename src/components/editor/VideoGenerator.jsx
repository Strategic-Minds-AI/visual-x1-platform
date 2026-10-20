import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clapperboard, Image as ImageIcon, Loader2, Upload } from "lucide-react";

const POLL_MS = 15000;
const MAX_POLLS = 40;

const STYLES = [
  {
    id: "viral",
    label: "Viral hook",
    seconds: 4,
    ratio: "9:16",
    prompt: (subject) =>
      `Vertical short-form video built to hold the first three seconds. ${subject}. The frame opens tight on the subject with one decisive motion, high contrast, a cool electric-blue rim light, clean background, the camera easing to a stop. Shot on a phone, crisp, cinematic. No burnt-in text.`
  },
  {
    id: "spin",
    label: "Product spin",
    seconds: 6,
    ratio: "1:1",
    prompt: (subject) =>
      `A smooth orbit around the subject on a seamless studio background. ${subject}. Soft key light, subtle specular highlights travelling across the surface, the camera gliding and easing to a stop, shallow depth of field. Product film look. No text.`
  },
  {
    id: "reveal",
    label: "Cinematic reveal",
    seconds: 8,
    ratio: "16:9",
    prompt: (subject) =>
      `Slow dolly-in on the subject with a shallow depth of field. ${subject}. Warm rim light against a deep navy background, atmospheric haze, the subject gradually resolving out of shadow, one continuous camera move. Cinematic, calm, premium. No text.`
  },
  {
    id: "beforeafter",
    label: "Before / after",
    seconds: 6,
    ratio: "9:16",
    prompt: (subject) =>
      `A before-and-after reveal in one continuous shot. ${subject}. Starts tight on the subject in its rough state, then a single clean sweep reveals the finished state, steady camera, identical lighting and framing across both halves, satisfying and premium. No text.`
  }
];

export default function VideoGenerator() {
  const [file, setFile] = useState(null);
  const [fileUri, setFileUri] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [styleId, setStyleId] = useState("viral");
  const [seconds, setSeconds] = useState("4");
  const [ratio, setRatio] = useState("9:16");
  const [model, setModel] = useState("seedance_2_fast");
  const [uploading, setUploading] = useState(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef(null);

  const style = STYLES.find((s) => s.id === styleId) || STYLES[0];

  useEffect(() => {
    if (!working) return undefined;
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer.current);
  }, [working]);

  const applyStyle = (id) => {
    const next = STYLES.find((s) => s.id === id) || STYLES[0];
    setStyleId(id);
    setSeconds(String(next.seconds));
    setRatio(next.ratio);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      setFileUri(up.file_uri);
      setImageUrl("");
    } catch (e) {
      setError(e?.response?.data?.error || "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const isProcessing = (s) => s === "queued" || s === "in_progress";

  const handleGenerate = async () => {
    setError("");
    setVideoUrl("");
    setElapsed(0);
    const source = imageUrl.trim() || fileUri;
    if (!source) {
      setError("Add the image the video should start from.");
      return;
    }
    const built = style.prompt(subject.trim() || "the subject shown in the image, kept exactly as it appears");
    setWorking(true);
    setStatus("queued");
    try {
      const created = await base44.functions.invoke("videoGateway", {
        action: "create",
        request: {
          model,
          prompt: built,
          seconds: Number(seconds),
          aspect_ratio: ratio,
          image_url: source,
          generate_audio: false
        }
      });
      let video = created.data;
      if (video?.error) throw new Error(video.error);
      setStatus(video.status || "queued");

      for (let attempt = 0; isProcessing(video.status) && attempt < MAX_POLLS; attempt += 1) {
        await wait(POLL_MS);
        const next = await base44.functions.invoke("videoGateway", { action: "retrieve", videoId: video.id });
        video = next.data;
        if (video?.error) throw new Error(video.error);
        setStatus(video.status || "in_progress");
      }

      if (isProcessing(video.status)) {
        setError(`Still rendering after ${Math.round((MAX_POLLS * POLL_MS) / 60000)} minutes. Job ${video.id} is saved — retrieve it again when you are ready.`);
        return;
      }
      if (video.status === "failed") throw new Error(video.error?.message || "The model could not render this video.");
      setStatus("completed");
      setVideoUrl(video.url || "");
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Video generation failed.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clapperboard className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium">Image to video</p>
        <Badge variant="outline" className="text-xs">one press</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Starting image</Label>
            <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />} Use this image
              </Button>
              {fileUri && <span className="text-xs text-emerald-500">uploaded (stored privately)</span>}
            </div>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="or paste a public image URL" className="text-xs" />
            {imageUrl.trim() || fileUri ? (
              <p className="text-xs text-muted-foreground truncate">Source: {imageUrl.trim() || fileUri}</p>
            ) : (
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><ImageIcon className="w-3 h-3" /> The image becomes the opening frame, so keep the logo centred.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>What should happen in the video (optional)</Label>
            <Textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              rows={2}
              className="text-sm resize-none"
              placeholder="e.g. the logo lifting off the card, or the finished floor panning across frame"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Style</Label>
              <Select value={styleId} onValueChange={applyStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seedance_2_fast">Seedance 2 Fast</SelectItem>
                  <SelectItem value="seedance_2_5">Seedance 2.5</SelectItem>
                  <SelectItem value="kling_3">Kling 3</SelectItem>
                  <SelectItem value="veo_3_1_fast">Veo 3.1 Fast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Seconds</Label>
              <Select value={seconds} onValueChange={setSeconds}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["4", "6", "8", "12"].map((s) => <SelectItem key={s} value={s}>{s}s</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Aspect</Label>
              <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["9:16", "1:1", "16:9"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={working || uploading}>
            {working ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Clapperboard className="w-4 h-4 mr-1.5" />}
            {working ? "Rendering…" : "Generate video"}
          </Button>
          {working && (
            <p className="text-xs text-muted-foreground">
              {status} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed. Rendering takes a few minutes; keep this tab open.
            </p>
          )}
          {error && (
            <p className="flex items-start gap-1.5 text-xs text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}
        </div>

        <div className="min-h-[240px] rounded-lg border border-border bg-muted/20 flex items-center justify-center overflow-hidden">
          {videoUrl ? (
            <video src={videoUrl} controls playsInline className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-muted-foreground p-6">
              <Clapperboard className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs mt-2">The rendered video appears here</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The image is the opening frame and the model re-renders from it, so fine text can drift. Video generation uses integration credits for every second rendered.
      </p>
    </div>
  );
}