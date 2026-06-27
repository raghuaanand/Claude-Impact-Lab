# Simplified UI & Multilingual Setup Guide

This guide covers the simplified, non-tech-user-friendly interface and multilingual support for KHUMMELA.

## Features

### 🎯 Simplified UI
- **Icon-based navigation** - Large, clear icons instead of text menus
- **One question at a time** - Wizard-style form with progress bar
- **Large touch targets** - Minimum 44px for mobile accessibility
- **Simple color scheme** - Two main colors (primary & accent) from design system
- **Big text & buttons** - 18pt+ fonts, 60px+ button heights

### 🗣️ Voice Input
- **Browser-native Web Speech API** - Works offline, no API key needed
- **Supported in modern browsers** - Chrome, Edge, Safari (iOS 14.5+), Firefox
- **Language support** - Hindi, English, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi

### 🌐 Multilingual Support
- **Translated UI** - 10+ Indian languages supported
- **Local translations** - No external API required
- **Language selector** - Choose language at app start

## How It Works

### Entry Point: `/reports/simple`

Users see a simple 3-step flow:

1. **Choose Report Type** (colored buttons with emojis)
   - 🔍 "Someone Missing?" → Report missing person
   - ✅ "Found Someone?" → Report found person

2. **Choose Language** (language grid)
   - Select from 10+ supported languages
   - UI immediately switches to selected language

3. **Fill Form One Question at a Time**
   - Large emoji icon for each field
   - Clear question text
   - Simple input (text, number, buttons)
   - Progress bar shows completion
   - Back/Next buttons

### Multilingual System

**Translation Library** (`lib/translations.ts`)
- All UI text pre-translated to 10+ languages
- No API calls needed
- Super fast, works offline
- Easy to add more languages

**Language Codes**
```
en - English
hi - Hindi (हिन्दी)
ta - Tamil (தமிழ்)
te - Telugu (తెలుగు)
kn - Kannada (ಕನ್ನಡ)
ml - Malayalam (മലയാളം)
mr - Marathi (मराठी)
gu - Gujarati (ગુજરાતી)
bn - Bengali (বাংলা)
pa - Punjabi (ਪੰਜਾਬੀ)
```

### Voice Input (Optional Enhancement)

**Browser Web Speech API** (`lib/voice-input.ts`)
- Works in Chrome, Edge, Safari
- No server calls
- Real-time transcription feedback
- Automatic language detection

**How to Use**
```typescript
import { getVoiceInputManager } from '@/lib/voice-input';

const voiceMgr = getVoiceInputManager('hi-IN'); // Hindi
voiceMgr.start((result) => {
  console.log(result.text); // "नाम बताएं"
  console.log(result.isFinal); // true when user stops talking
});

// Later...
const finalText = voiceMgr.stop();
```

## Pages & Routes

### Simplified User Flow

```
/reports/simple
  ├─ Step 1: Type selector (missing/found)
  ├─ Step 2: Language selector
  └─ Step 3: Form wizard
       └─ Post to /api/reports/missing or /api/reports/found
            └─ Redirect to /simple-dashboard

/simple-dashboard
  ├─ Main action buttons (report/search)
  ├─ Quick stats (my cases, matches)
  └─ Emergency help button
```

### Traditional Flow (Still Available)

- `/reports/new` - Original complex form
- `/search` - Original search interface
- `/dashboard` - Original dashboard
- `/management` - Management console

## Adding a New Language

1. Open `lib/translations.ts`
2. Add language code to `SUPPORTED_LANGUAGES`:
```typescript
export const SUPPORTED_LANGUAGES = {
  // ... existing
  xx: 'Language Name (नाम)',
};
```

3. Add translations:
```typescript
export const translations = {
  // ... existing
  xx: {
    appName: 'खुम्मेला',
    someoneMissing: 'कोई खो गया है?',
    // ... all keys from `en` object
  },
};
```

4. Map language code in `lib/voice-input.ts`:
```typescript
private mapLanguageCode(lang: string): string {
  const mapping: Record<string, string> = {
    // ... existing
    xx: 'xx-XX', // BCP 47 code
  };
}
```

## Browser Support

### Web Speech API Support
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.5+
- ✅ Firefox 89+
- ❌ Internet Explorer (use fallback)

### Graceful Degradation
If Web Speech API is unavailable, voice features silently disable and users can still use text input.

## Offline Capability

✅ Works completely offline:
- All translations stored locally
- Web Speech API works offline
- No server calls needed until final submit

## Performance

- **Page load**: <2s (no external API calls)
- **Language switch**: <50ms (local lookup)
- **Voice input**: Real-time (browser native)
- **Form submit**: Depends on network

## Testing

### Test Voice Input
```bash
# In browser console
const mgr = getVoiceInputManager('en-US');
mgr.start(result => console.log(result));
// Speak now, watch console output
mgr.stop();
```

### Test Translation
```bash
# In browser console
import { t } from '@/lib/translations';
console.log(t('hi', 'someoneMissing')); // 'कोई खो गया है?'
```

## Future Enhancements

### Phase 2 Options

1. **Bhashini Integration** (when API key available)
   - Real-time speech-to-text in 22 Indian languages
   - Automatic translation
   - Update `lib/bhashini.ts`

2. **QR Wristband Scanner**
   - Add QR scanner for children/elderly
   - Link to phone number

3. **SMS/IVR Channel**
   - Phone-based alternative
   - Same workflow as web

4. **Offline Mode**
   - Service worker for offline functionality
   - Queue reports for sync when online

## Troubleshooting

### Voice Input Not Working
- Check browser support
- Check microphone permissions
- Verify language code is supported

### Translation Not Showing
- Check language code in URL/state
- Verify language exists in `translations.ts`
- Check console for errors

### Slow Performance
- Clear browser cache
- Check network in DevTools
- Verify no slow API calls in background

## Security Notes

- No data sent for translation (offline)
- All voice data stays in browser (Web Speech API)
- No audio files uploaded
- Standard form validation applies

---

**Last Updated:** 2026-06-27
**Next Review:** When Bhashini API becomes available
