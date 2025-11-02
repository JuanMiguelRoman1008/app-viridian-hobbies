"use client";

export default function ImageGallery({ imageUrls, baseUrl }: { imageUrls: string[], baseUrl: string }) {
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Image URL copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {imageUrls.map((url) => (
        <div key={url} className="group relative">
          <img
            src={`${baseUrl}${url}`}
            alt={url}
            className="w-full h-auto object-cover rounded-md"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => copyToClipboard(`${baseUrl}${url}`)}
              className="text-white text-sm"
            >
              Copy URL
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
