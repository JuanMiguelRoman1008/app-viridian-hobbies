import ImageGallery from "@/components/ui/image-gallery";
import fs from "fs/promises";
import path from "path";

export default async function BrandedImagesPage() {
  const imageDir = path.join(process.cwd(), "../../api/image_database/branded");
  const baseUrl = "http://localhost:3001";
  let imageUrls: string[] = [];
  let error = null;

  try {
    const files = await fs.readdir(imageDir);
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    imageUrls = files
      .filter((file) => imageExtensions.some(ext => path.extname(file).toLowerCase() === ext))
      .map((file) => `/image-database/branded/${file}`);
  } catch (e) {
    console.error(e);
    error = "Could not read image directory. Make sure the backend is running and the directory exists.";
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Branded Images</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : imageUrls.length === 0 ? (
        <p>No branded images found.</p>
      ) : (
        <ImageGallery imageUrls={imageUrls} baseUrl={baseUrl} />
      )}
    </>
  );
}
