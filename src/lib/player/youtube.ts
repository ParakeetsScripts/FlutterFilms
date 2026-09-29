declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
            onStateChange?: (event: { data: number; target: YtPlayer }) => void;
            onError?: () => void;
          };
        },
      ) => YtPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

let youtubeApiPromise: Promise<void> | null = null;

export function youtubeIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube-nocookie\.com\/embed\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}

function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const done = () => resolve();
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      done();
    };

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll);
          done();
        }
      }, 80);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });

  return youtubeApiPromise;
}

export function mountYoutubePlayer(
  host: HTMLElement,
  videoId: string,
  hooks: {
    onReady?: (player: YtPlayer) => void;
    onError?: () => void;
  },
): () => void {
  let player: YtPlayer | null = null;
  let disposed = false;

  void loadYoutubeApi().then(() => {
    if (disposed || !window.YT?.Player) {
      hooks.onError?.();
      return;
    }

    player = new window.YT.Player(host, {
      videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3,
      },
      events: {
        onReady: (event) => hooks.onReady?.(event.target),
        onError: () => hooks.onError?.(),
      },
    });
  });

  return () => {
    disposed = true;
    player?.destroy();
    player = null;
  };
}
