# PWA Setup for TravelAI

This document explains the Progressive Web App (PWA) implementation for TravelAI, optimized for iPhone and mobile devices.

## Features Implemented

### ✅ iOS PWA Support
- **Manifest.json**: Complete PWA manifest with app metadata
- **Icons**: Multiple sizes (72px - 512px) for all devices
- **Apple Touch Icons**: Optimized for iOS home screen
- **Meta Tags**: iOS-specific tags for standalone mode, status bar, viewport
- **Safe Area Support**: iPhone notch and home indicator handling

### ✅ Offline Capability
- **Service Worker**: Caches essential resources for offline use
- **Network-First Strategy**: Always tries network first, falls back to cache
- **Offline Page**: Custom offline experience when network is unavailable

### ✅ Install Prompts
- **iOS Safari**: Step-by-step instructions for adding to home screen
- **Android Chrome**: Native install banner
- **Smart Detection**: Only shows on supported devices, respects user dismissal

### ✅ Mobile Optimizations
- **Touch Targets**: Minimum 44px touch targets (iOS guidelines)
- **Safe Areas**: CSS utilities for iPhone notch (`safe-top`, `safe-bottom`, etc.)
- **No Bounce**: Disabled overscroll bounce effect
- **Haptic Ready**: Vibration API support (already implemented in Buffalo game)
- **Performance**: Optimized for mobile networks

## File Structure

```
/public
  ├── manifest.json          # PWA manifest
  ├── sw.js                  # Service worker
  ├── offline.html           # Offline fallback page
  └── /icons                 # App icons (72px - 512px)
      ├── icon-72x72.png
      ├── icon-96x96.png
      ├── icon-128x128.png
      ├── icon-144x144.png
      ├── icon-152x152.png
      ├── icon-192x192.png
      ├── icon-384x384.png
      ├── icon-512x512.png
      └── apple-touch-icon.png

/components
  └── PWAInstaller.tsx       # Install prompt component

/app
  ├── layout.tsx             # Root layout with PWA meta tags
  └── globals.css            # iOS safe area CSS variables
```

## iOS Safe Area Utilities

Use these CSS classes to handle iPhone notch and home indicator:

```tsx
// Padding for top notch
<div className="safe-top">Content</div>

// Padding for bottom home indicator
<div className="safe-bottom">Content</div>

// Padding for left and right edges
<div className="safe-x">Content</div>

// All safe areas
<div className="safe-all">Content</div>
```

## Testing on iPhone

### Test in Safari
1. Open https://your-domain.com in Safari on iPhone
2. You should see an install prompt after 2 seconds
3. Follow the instructions to add to home screen

### Test Standalone Mode
1. After installing, launch from home screen
2. App should open in fullscreen (no Safari UI)
3. Status bar should be visible
4. Safe areas should be respected

### Test Offline
1. Install the app
2. Open Settings → Airplane Mode
3. Launch the app
4. Should show cached content or offline page

## Customization

### Change Theme Color
Edit `app/layout.tsx` and `public/manifest.json`:
```typescript
themeColor: "#3b82f6"  // Your brand color
```

### Change App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "AppName"
}
```

### Update Icons
Replace files in `/public/icons/` with your branding. Recommended:
- Use https://realfavicongenerator.net/ for production-quality icons
- Maintain all sizes for best compatibility
- Use maskable icons for Android

### Modify Offline Page
Edit `/public/offline.html` to match your brand style.

### Adjust Install Prompt
Edit `/components/PWAInstaller.tsx`:
- Change delay: `setTimeout(() => setShowIOSPrompt(true), 2000)`
- Modify copy and styling
- Add analytics tracking

## Service Worker Caching Strategy

Current: **Network First, Cache Fallback**
- Always tries to fetch from network
- Falls back to cache if offline
- Updates cache with successful responses

To change strategy, edit `/public/sw.js`.

## Performance Tips

### Optimize Images
- Use Next.js `<Image>` component for automatic optimization
- Implement lazy loading for below-the-fold images
- Use WebP format with fallbacks

### Reduce Bundle Size
- Use dynamic imports for large components
- Tree-shake unused libraries
- Code split by route

### Cache Strategy
- Pre-cache critical routes in service worker
- Use stale-while-revalidate for static assets
- Implement background sync for offline actions

## Browser Support

| Feature | iOS Safari | Chrome Android | Desktop |
|---------|-----------|----------------|---------|
| Install Prompt | ✅ (Manual) | ✅ (Auto) | ✅ |
| Offline Mode | ✅ | ✅ | ✅ |
| Push Notifications | ❌ | ✅ | ✅ |
| Background Sync | ❌ | ✅ | ✅ |
| Safe Areas | ✅ | ⚠️ (Limited) | N/A |

## Security Considerations

- Service worker only works on HTTPS
- Use Content Security Policy headers
- Validate all cached content
- Implement CORS properly for API requests

## Analytics

Track PWA adoption:
```javascript
// In PWAInstaller.tsx
window.gtag?.('event', 'pwa_install_prompt_shown');
window.gtag?.('event', 'pwa_installed');
```

## Deployment Checklist

- [ ] Icons generated and optimized
- [ ] Manifest.json updated with production URLs
- [ ] Service worker tested on HTTPS
- [ ] iOS tested on real device
- [ ] Android tested on real device
- [ ] Offline functionality verified
- [ ] Safe areas tested on iPhone X+
- [ ] Performance audited with Lighthouse
- [ ] Analytics tracking added

## Troubleshooting

### Install prompt not showing on iOS
- Must be in Safari (not Chrome/Firefox)
- Must not be in Private Browsing
- User must not have dismissed it before (check localStorage)

### Service worker not updating
- Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear site data in DevTools
- Increment cache version in sw.js

### Safe areas not working
- Verify `viewport-fit=cover` in meta tag
- Check CSS variables are defined
- Test on real device (simulator may not show notch)

## Resources

- [Apple PWA Guidelines](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox (Advanced SW)](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
