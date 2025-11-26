import React, { useState, useEffect } from 'react';

interface LinkPreviewCardProps {
  url: string;
  websiteName: string;
  index: number;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

/**
 * LinkPreviewCard - Displays a product link with preview image and metadata
 * Falls back to basic display if metadata can't be fetched
 */
const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, websiteName, index }) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Extract domain for display
  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return websiteName;
    }
  };

  // Generate a placeholder image URL using the domain
  const getPlaceholderImage = () => {
    const domain = getDomain(url);
    // Use a gradient based on the seller index for visual variety
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
    ];
    const gradient = gradients[index % gradients.length];

    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <div className="text-white text-center p-4">
          <div className="text-3xl font-bold mb-2">🛒</div>
          <div className="text-sm font-medium">{domain}</div>
        </div>
      </div>
    );
  };

  // Fetch link metadata (you could create a backend endpoint for this)
  useEffect(() => {
    // For now, we'll use a simple approach with favicon
    // In production, you'd want a backend service to fetch Open Graph metadata
    const domain = getDomain(url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    setMetadata({
      title: websiteName,
      description: 'View this product on ' + domain,
      favicon: faviconUrl,
    });
    setLoading(false);
  }, [url, websiteName]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all duration-200">
        {/* Image/Thumbnail Section */}
        <div className="relative w-full h-32 bg-gray-100 overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : metadata?.image && !imageError ? (
            <img
              src={metadata.image}
              alt={metadata.title || 'Product preview'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
          ) : (
            getPlaceholderImage()
          )}

          {/* External link indicator */}
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1.5 shadow-md">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Website Name */}
          <div className="flex items-center gap-2 mb-1">
            {metadata?.favicon && (
              <img
                src={metadata.favicon}
                alt=""
                className="w-4 h-4"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
            <h4 className="font-semibold text-gray-800 text-sm truncate">
              {metadata?.title || websiteName}
            </h4>
          </div>

          {/* Domain/URL */}
          <p className="text-xs text-gray-500 truncate mb-2">
            {getDomain(url)}
          </p>

          {/* Description (if available) */}
          {metadata?.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {metadata.description}
            </p>
          )}

          {/* Call to action */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 group-hover:text-blue-800">
              Visit Store
            </span>
            <svg className="w-4 h-4 text-blue-600 group-hover:text-blue-800 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
};

export default LinkPreviewCard;
