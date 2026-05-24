/**
 * Notification sound utility using Web Audio API
 * Creates a pleasant notification chime without requiring external audio files
 */

let audioContext: AudioContext | null = null;

// Initialize AudioContext on first user interaction (required by browsers)
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Plays a notification chime sound
 * Uses Web Audio API to generate a pleasant two-tone notification
 */
export function playNotificationSound(type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Configure frequencies based on notification type
    const frequencies = {
      info: [523.25, 659.25], // C5, E5 - pleasant rising tone
      success: [523.25, 783.99], // C5, G5 - major interval
      warning: [440, 349.23], // A4, F4 - descending
      error: [349.23, 293.66], // F4, D4 - minor descending
    };
    
    const [freq1, freq2] = frequencies[type];
    
    // Create oscillators for two-tone chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Use sine wave for smooth, pleasant sound
    osc1.type = 'sine';
    osc2.type = 'sine';
    
    osc1.frequency.setValueAtTime(freq1, now);
    osc2.frequency.setValueAtTime(freq2, now);
    
    // Create envelope for natural sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Slow decay
    
    // Connect nodes
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Play first tone
    osc1.start(now);
    osc1.stop(now + 0.15);
    
    // Play second tone slightly delayed
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
    
  } catch (error) {
    // Silently fail if audio is not available
    console.warn('Could not play notification sound:', error);
  }
}

/**
 * Plays a more urgent alert sound for critical/high priority tickets
 */
export function playUrgentSound(): void {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Three-tone urgent pattern
    const frequencies = [880, 1046.5, 880]; // A5, C6, A5
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const startTime = now + (index * 0.12);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
    
  } catch (error) {
    console.warn('Could not play urgent sound:', error);
  }
}
