# Frontend Integration Guide

This document describes how to build the **user-facing React client** for the
movie rental platform.  The admin dashboard already exists under
`admin-dashboard/`; the following sections cover the public app and playback
logic that are not part of the repository.

---

## Dependencies

- `hls.js` (already present in backend dependencies but install again in the
  frontend)
- React 18+ (or 17 with hooks)
- `axios` or your favourite HTTP client

```
npm install hls.js axios
```

---

## Playback component

Create a component that requests the HLS playlist URL from the backend and
initialises `hls.js`.  Example:

```jsx
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import api from "./api/axios"; // your configured axios instance

export function MoviePlayer({ movieId, token }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let hls;
    const loadPlaylist = async () => {
      try {
        const res = await api.get(`/api/movies/${movieId}/stream`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const url = res.data.data.hlsPlaylistUrl;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true });
          hls.loadSource(url);
          hls.attachMedia(videoRef.current);
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          videoRef.current.src = url;
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    loadPlaylist();
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [movieId, token]);

  if (error) return <p className="text-red-500">{error}</p>;
  return <video ref={videoRef} controls style={{ width: "100%" }} />;
}
```

### Usage flow

1. After successful payment the frontend should call `/api/movies/:id/stream`.
2. If the response is `200` the body contains `{ hlsPlaylistUrl }`.
3. Pass that URL to the player component (or have the component fetch it
   itself as shown above).
4. Before the user has purchased the movie you can render the banner image or
   a placeholder and hide/disable the play button.

---

## Upload form (public site)

The `MovieUploadForm` component in the admin dashboard already contains the
necessary fields.  A public upload form for users would mirror that form but
omit the category/tag creation and the authentication/authorization logic.


---

## Category/Tag Dropdowns

- Fetch `/api/categories` and `/api/tags` when the page loads.
- Populate `<select>` elements as shown in the admin form example.
- Populate `category` and `tags` fields when sending a POST/PUT to
  `/api/admin/movies` (or to a public equivalent if you build one).

---

## Responsive Considerations

- The player and form components should use CSS grid/flexbox to collapse
  neatly on mobile as in the admin-dashboard style sheet.
- Show loading spinners while waiting for network requests.

---

## Error & Loading States

- Use error boundaries around API calls (see examples in admin dashboard).
- Disable submit buttons when requests are in-flight and show progress
  indicators when uploading large files.

---

This guide is deliberately high‑level; adapt the snippets to your existing
React application structure.
