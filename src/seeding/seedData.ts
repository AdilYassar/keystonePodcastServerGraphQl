import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: "dsmsrobdd", // Your Cloudinary cloud name
    api_key: process.env.CLOUDINARY_API_KEY, // API key from environment variables
    api_secret: process.env.CLOUDINARY_API_SECRET, // API secret from environment variables
    secure: true, // Use HTTPS
});

// Generate a URL for the video
const url = cloudinary.url('Think_Fast_Talk_Smart__Communication_Techniques_y2bkcx', {
    resource_type: "video", // Specify the resource type as video
    transformation: [
        { format: "mp4" }, // Convert to a browser-compatible video format (e.g., MP4)
    ],
});

// Log the generated URL
console.log("Video URL for Browser Playback:", url);
