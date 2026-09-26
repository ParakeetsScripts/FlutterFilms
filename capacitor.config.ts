const serverUrl = process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const config = {
  appId: "com.flutterfilms.app",
  appName: "FlutterFilms",
  webDir: "out",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://localhost"),
  },
  ios: {
    contentInset: "automatic",
    scheme: "FlutterFilms",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0a0a0c",
    },
  },
};

export default config;
