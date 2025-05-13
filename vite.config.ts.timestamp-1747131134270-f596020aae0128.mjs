// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  // Ensure environment variables are replaced during build
  define: {
    "process.env": {}
  },
  // Use relative paths for assets
  base: "",
  build: {
    sourcemap: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash].[ext]",
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
        manualChunks: {
          react: ["react", "react-dom"],
          leaflet: ["leaflet", "react-leaflet"],
          three: ["three"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgc2VydmVyOiB7XG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUsIG5vLXN0b3JlLCBtdXN0LXJldmFsaWRhdGUnLFxuICAgICAgJ1ByYWdtYSc6ICduby1jYWNoZScsXG4gICAgICAnRXhwaXJlcyc6ICcwJ1xuICAgIH1cbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgLy8gRW5zdXJlIGVudmlyb25tZW50IHZhcmlhYmxlcyBhcmUgcmVwbGFjZWQgZHVyaW5nIGJ1aWxkXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudic6IHt9LFxuICB9LFxuICAvLyBVc2UgcmVsYXRpdmUgcGF0aHMgZm9yIGFzc2V0c1xuICBiYXNlOiAnJyxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5baGFzaF0uW2V4dF0nLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLltoYXNoXS5qcycsXG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHJlYWN0OiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIGxlYWZsZXQ6IFsnbGVhZmxldCcsICdyZWFjdC1sZWFmbGV0J10sXG4gICAgICAgICAgdGhyZWU6IFsndGhyZWUnXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsaUJBQWlCO0FBQUEsTUFDakIsVUFBVTtBQUFBLE1BQ1YsV0FBVztBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLGVBQWUsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQSxFQUVBLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLHNCQUFzQjtBQUFBLElBQ3RCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGNBQWM7QUFBQSxVQUNaLE9BQU8sQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM1QixTQUFTLENBQUMsV0FBVyxlQUFlO0FBQUEsVUFDcEMsT0FBTyxDQUFDLE9BQU87QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
