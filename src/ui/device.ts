export async function requestLandscapePlayMode() {
  const root = document.documentElement;
  try {
    if (!document.fullscreenElement && root.requestFullscreen) {
      await root.requestFullscreen();
    }
  } catch {
    // Some mobile browsers require installed-app context. Gameplay still works.
  }

  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: 'landscape') => Promise<void>;
    };
    await orientation.lock?.('landscape');
  } catch {
    // Landscape is encouraged by manifest and portrait blocker when lock is denied.
  }
}
