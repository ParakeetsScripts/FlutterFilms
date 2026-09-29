import type { Option } from "artplayer";

type LayerOption = NonNullable<Option["layers"]>[number];
type MenuOption = NonNullable<Option["contextmenu"]>[number];
type ControlOption = NonNullable<Option["controls"]>[number];
import type { PlaybackSource } from "@/lib/playback/types";
import { buildCinemaDanmuku, buildCinemaHeatmap, type CinemaMode } from "@/lib/player/cinema-danmuku";
import { loadDanmukuPlugin, loadHls } from "@/lib/player/load-player-modules";
import { mountYoutubePlayer, youtubeIdFromUrl } from "@/lib/player/youtube";

const THEME = "#5b9fd4";

/** ArtPlayer requires poster to be a string — never pass undefined. */
const DEFAULT_CINEMA_POSTER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function resolveCinemaPoster(poster?: string | null): string {
  return poster?.trim() ? poster : DEFAULT_CINEMA_POSTER;
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function sourceLabel(source: PlaybackSource, mode: CinemaMode): string {
  if (source.type === "embed") return mode === "trailer" ? "TMDB trailer" : "YouTube embed";
  if (source.isLive) return "Live stream";
  if (source.type === "hls") return "HLS / CDN";
  if (source.type === "dash") return "DASH stream";
  return "Authorized playback";
}

function buildLayers(source: PlaybackSource, mode: CinemaMode): LayerOption[] {
  return [
    {
      name: "cinema-vignette",
      html: '<div class="cinema-layer-vignette" aria-hidden="true"></div>',
      style: {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
      },
    },
    {
      name: "cinema-badge",
      html: '<span class="cinema-layer-badge">FlutterFilms Cinema</span>',
      style: {
        position: "absolute",
        top: "14px",
        left: "14px",
        pointerEvents: "none",
      },
    },
    {
      name: "cinema-source",
      html: `<span class="cinema-layer-source">${sourceLabel(source, mode)}</span>`,
      style: {
        position: "absolute",
        top: "14px",
        right: "14px",
        pointerEvents: "none",
      },
    },
  ];
}

function buildContextMenu(movieId?: number, movieTitle?: string, mode: CinemaMode = "watch"): MenuOption[] {
  const resolvedMovieId = movieId;

  return [
    {
      name: "copy-timestamp",
      html: "Copy timestamp",
      click() {
        void navigator.clipboard?.writeText(formatTimestamp(this.currentTime));
      },
    },
    {
      name: "theater-mode",
      html: "Theater mode",
      click() {
        this.fullscreenWeb = !this.fullscreenWeb;
      },
    },
    {
      name: "toggle-reactions",
      html: "Toggle cinema reactions",
      click() {
        const plugin = this.plugins?.artplayerPluginDanmuku as { isHide?: boolean; show?: () => void; hide?: () => void } | undefined;
        if (!plugin) return;
        if (plugin.isHide) plugin.show?.();
        else plugin.hide?.();
      },
    },
    {
      name: "flutter-ai",
      html: "Ask FlutterAI about this title",
      click() {
        const params = new URLSearchParams();
        if (resolvedMovieId) params.set("movie", String(resolvedMovieId));
        if (movieTitle) params.set("title", movieTitle);
        window.open(`/flutter-ai?${params.toString()}`, "_blank", "noopener,noreferrer");
      },
    },
    {
      name: "back-to-title",
      html: mode === "trailer" ? "Back to movie page" : "Back to details",
      click() {
        if (resolvedMovieId) window.location.href = `/movie/${resolvedMovieId}`;
      },
    },
  ];
}

function buildControls(movieId?: number, movieTitle?: string): ControlOption[] {
  return [
    {
      name: "flutter-ai-chip",
      position: "right",
      index: 20,
      html: '<span class="cinema-control-ai" aria-hidden="true">✦ AI</span>',
      tooltip: "Open FlutterAI",
      click() {
        const params = new URLSearchParams();
        if (movieId) params.set("movie", String(movieId));
        if (movieTitle) params.set("title", movieTitle);
        window.open(`/flutter-ai?${params.toString()}`, "_blank", "noopener,noreferrer");
      },
    },
  ];
}

function artTypeForSource(source: PlaybackSource): string {
  if (source.type === "embed") return "youtube";
  if (source.type === "hls") return "m3u8";
  if (source.type === "dash") return "mpd";
  return "mp4";
}

export async function buildCinemaArtplayerOptions(input: {
  container: HTMLDivElement;
  source: PlaybackSource;
  poster?: string;
  movieId?: number;
  movieTitle?: string;
  mode: CinemaMode;
  onError: (message: string) => void;
}): Promise<Option> {
  const { container, source, poster, movieId, movieTitle, mode, onError } = input;
  const Hls = await loadHls();
  const artplayerPluginDanmuku = await loadDanmukuPlugin();

  const danmukuSeed = {
    mode,
    movieId: movieId ?? source.movieId,
    title: movieTitle ?? source.title,
  };

  return {
    container,
    url: source.url,
    type: artTypeForSource(source),
    poster: resolveCinemaPoster(poster),
    volume: 0.85,
    autoplay: false,
    muted: false,
    pip: source.type !== "embed",
    autoSize: false,
    autoMini: true,
    screenshot: source.type !== "embed",
    setting: true,
    playbackRate: source.type !== "embed" && !source.isLive,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: false,
    isLive: Boolean(source.isLive),
    theme: THEME,
    lang: "en",
    layers: buildLayers(source, mode),
    contextmenu: buildContextMenu(movieId ?? source.movieId, movieTitle ?? source.title, mode),
    controls: buildControls(movieId ?? source.movieId, movieTitle ?? source.title),
    highlight: [
      { time: 6, text: "Cold open" },
      { time: 38, text: "Peak moment" },
      { time: 72, text: "Finale beat" },
    ],
    cssVar: {
      "--art-theme": THEME,
      "--art-control-height": "46px",
      "--art-control-icon-size": "22px",
      "--art-control-icon-scale": 1.05,
      "--art-contextmenus-min-width": "220px",
    },
    moreVideoAttr: {
      playsInline: true,
      preload: "metadata",
    },
    plugins: [
      artplayerPluginDanmuku({
        danmuku: buildCinemaDanmuku(danmukuSeed),
        speed: 5,
        opacity: 0.88,
        margin: [12, "28%"],
        mode: 0,
        antiOverlap: true,
        synchronousPlayback: true,
        emitter: true,
        visible: true,
        maxLength: 72,
        lockTime: 4,
        heatmap: {
          opacity: 0.55,
          scale: 0.85,
        },
        points: buildCinemaHeatmap(danmukuSeed),
        beforeEmit: (danmu) => danmu.text.trim().length > 0 && danmu.text.length <= 72,
      }),
    ],
    customType: {
      m3u8(video, url, art) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, () => onError("Playback is temporarily unavailable."));
          art.on("destroy", () => hls.destroy());
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          return;
        }
        onError("HLS playback is not supported in this browser.");
      },
      youtube(video, url, art) {
        const videoId = youtubeIdFromUrl(url);
        if (!videoId) {
          onError("YouTube trailer unavailable.");
          return;
        }

        const host = video.parentElement;
        if (!host) {
          onError("YouTube trailer unavailable.");
          return;
        }

        video.style.display = "none";
        const mount = document.createElement("div");
        mount.className = "cinema-player__youtube-host";
        host.appendChild(mount);

        let syncTimer: number | undefined;

        const destroyYoutube = mountYoutubePlayer(mount, videoId, {
          onReady: (player) => {
            const duration = player.getDuration();
            if (duration > 0) {
              Object.defineProperty(video, "duration", {
                configurable: true,
                get: () => duration,
              });
            }

            syncTimer = window.setInterval(() => {
              const current = player.getCurrentTime();
              if (Number.isFinite(current)) art.currentTime = current;
            }, 300);

            art.on("video:play", () => player.playVideo());
            art.on("video:pause", () => player.pauseVideo());
            art.on("seek", (_current, time) => player.seekTo(time, true));
          },
          onError: () => onError("YouTube trailer unavailable."),
        });

        art.on("destroy", () => {
          if (syncTimer) window.clearInterval(syncTimer);
          destroyYoutube();
          mount.remove();
        });
      },
    },
  };
}
