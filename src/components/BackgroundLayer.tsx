import React, { useEffect, useState } from 'react';

interface BackgroundLayerProps {
  imageUrl: string;
  themeFallback: string;
  isNight: boolean;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  imageUrl,
  themeFallback,
  isNight,
}) => {
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const [isCrossFading, setIsCrossFading] = useState(false);

  useEffect(() => {
    if (imageUrl !== currentImage) {
      setPrevImage(currentImage);
      setCurrentImage(imageUrl);
      setIsCrossFading(true);

      const timer = setTimeout(() => {
        setIsCrossFading(false);
        setPrevImage(null);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [imageUrl, currentImage]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Fallback thematic gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${themeFallback} transition-colors duration-1000`} />

      {/* Outgoing previous image during fade */}
      {prevImage && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
            isCrossFading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundImage: `url(${prevImage})` }}
        />
      )}

      {/* Incoming active image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
          isCrossFading ? 'opacity-100' : 'opacity-100'
        }`}
        style={{ backgroundImage: `url(${currentImage})` }}
      />

      {/* Dark overlay scrim with night compensation for maximum readability */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isNight
            ? 'bg-gradient-to-b from-slate-950/75 via-slate-950/65 to-black/85 backdrop-brightness-75'
            : 'bg-gradient-to-b from-black/55 via-black/45 to-black/70 backdrop-brightness-90'
        }`}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
};
